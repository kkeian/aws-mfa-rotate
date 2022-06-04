import { STSClient, GetSessionTokenCommand } from "@aws-sdk/client-sts";
import { fromIni } from "@aws-sdk/credential-providers";
import { parse as ParseIni, stringify as StringifyIni } from "ini";
import { readFileSync, writeFileSync } from "fs";
import { homedir } from "os";

// Grabs MFA serial stored in MFA dummy profile in
// .aws/config file. Format is assumed to have a suffix
// of `mfa` with no space between the account name used
// to authenticate with STS.
function getMFASerial(profile) {
    const credFileName = homedir() + "/.aws/config";
    const credFile = ParseIni(readFileSync(credFileName, "utf-8"));
    const mfaProfile = "profile " + profile + "mfa";
    
    return credFile[mfaProfile].mfa_serial;
}

export async function rotateMFA(profile, mfaCode) {
    const mfaSerial = getMFASerial(profile);
    // Get IAM creds (non-MFA) to renew session token.
    const clientSTS = new STSClient({
        credentials: fromIni({
            profile
        }),
        region: "us-east-1"
    });

    // Construct command to send to STS to request temporary
    // session credentials.
    const command = new GetSessionTokenCommand({
        SerialNumber: mfaSerial,
        TokenCode: mfaCode
    });
    // Send request to get MFA session credentials.
    try {
        const temporaryCredential = await clientSTS.send(command);
        return temporaryCredential;
    } catch (err) {
        console.error(err);
    }  
};

// Commit temporary session credentials to main AWS cred file
// Note: AWS CLI/SDK merge credentials from .aws/config and .aws/credentials
//       files. If name conflicts arise (i.e. a section of the .aws/credentials
//       file has format [thisprofile] and a section of .aws/config file
//       has the format [profile thisprofile]) .aws/credentials entries will
//       take precendence and the .aws/config entry will be ignored.
export async function editCredentialsFile(profile, tempCreds) {
    const credFileName = homedir() + "/.aws/credentials";
    const credFile = ParseIni(readFileSync(credFileName, "utf-8"));
    // Replace with temporary values
    credFile[profile].aws_access_key_id = tempCreds.Credentials.AccessKeyId;
    credFile[profile].aws_secret_access_key = tempCreds.Credentials.SecretAccessKey;
    credFile[profile].aws_session_token = tempCreds.Credentials.SessionToken;

    // Write out temporary values to main credentials file.
    writeFileSync(credFileName, StringifyIni(credFile));
}