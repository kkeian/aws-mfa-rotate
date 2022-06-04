#!/usr/bin/env node
import { program } from "commander";
import { rotateMFA, editCredentialsFile } from "../src/main.js";

program
    .command("rotate")
    .description("rotates MFA credentials used to authenticate AWS API calls")
    .requiredOption("-t|--token <number>", "token PIN from MFA device")
    .option("-p|--profile <string>", "name of MFA profile listed in .aws/config file")
    .action(async (options) => {
        const mfaToken = options.token;
        let profile = "";
        if (options.profile) {
            profile = options.profile;
        }
        try {
            const tempCreds = await rotateMFA(profile, mfaToken);
            if (typeof tempCreds !== 'undefined') {
                const results = await editCredentialsFile(profile+"mfa", tempCreds);
            } else {
                throw new Error("No credentials returned.")
            }
        } catch (err) {
            console.error(err);
        }
    });
program.parse();
