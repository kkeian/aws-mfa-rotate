# aws-mfa-rotate
Simple CLI tool to rotate AWS CLI/SDK temporary credentials.

## General structure
- src: holds main logic of program.
- bin: holds command line interface configuration.

## Expected .aws files format:
- .aws/config file:
    > Should have at least 2 entries for the account used for MFA:

```ini
[profile accountName]
aws_access_key_id = [keyId]
aws_secret_access_key = [secretKey]
region = [regionHere]

[profile accountNamemfa]
aws_access_key_id = [randomDummyValue]
aws_secret_access_key = [randomDummyValue]
aws_session_token = [randomDummyValue]
mfa_serial = [MfaArn]
region = [regionHere]
```

- .aws/credentials file
    > Should have at least 1 entry:

```ini
[accountNamemfa]
aws_access_key_id = [randomDummyValue]
aws_secret_access_key = [randomDummyValue]
aws_session_token = [randomDummyValue]
```

### How it works:
1. AWS access key pair is used to authenticate with AWS STS service.
2. Once authenticated, the GenerateSessionToken command is sent to STS.
3. A temporary `access key id`, `secret access key`, and `session token` are returned.
4. The temporary credentials are written to `.aws/credentials` file.
    - The named profile configuration in this file always takes precendence over
    any named profile configuration in `.aws/config`, but we have a duplicate dummy
    entry in `.aws/config` to hold the `mfa_serial` used to request a new temporary
    credential.
5. You're able to use the AWS CLI/SDK to connect to the AWS Account you generated
   temporary credentials for, along with any AWS Accounts configured with a role
   that can be assumed by the user you generated temporary credentials for.
   - Note: if you intend to authenticate to other AWS Accounts via role assumption,
   you will need to configure that in the `.aws/config` file. This is done by specifying
   the `source_profile` key under the named profile of the AWS Account with the role
   to assume. The `source_profile` key needs to refer to the section name for the named profile
   temporary credentials were written to in the `.aws/credentials` file.

### Contributing
Feel free to submit PR with improvements. This is a hobby project only managed by me so don't expect a quick turnaround.