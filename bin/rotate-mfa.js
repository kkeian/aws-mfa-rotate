#!/usr/bin/env node
import { program } from "commander";
import { rotateMFA, editCredentialsFile } from "../src/main.js";



program
    .command("rotate")
    .description("rotates MFA credentials used to authenticate AWS API calls")
    .requiredOption("-t|--token <number>", "token PIN from MFA device")
    .requiredOption("-p|--profile <string>", "name of non-MFA profile listed in .aws/config file")
    .action(async (options) => {
        const secPerHr = 60*60;
        const defaultSessionDurationHrs = 12
        
        const mfaToken = options.token;
        const profile = options.profile;
        let duration = secPerHr*defaultSessionDurationHrs;
        if (typeof options.duration !== "undefined") {
            duration = options.duration;
        }
        try {
            const tempCreds = await rotateMFA(profile, mfaToken, duration);
            if (typeof tempCreds !== "undefined") {
                const results = await editCredentialsFile(profile+"mfa", tempCreds);
            } else {
                throw new Error("No credentials returned.")
            }
        } catch (err) {
            console.error(err);
        }
    });
program.parse();
