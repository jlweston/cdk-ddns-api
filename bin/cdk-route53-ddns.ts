#!/usr/bin/env node

import { config } from "dotenv";

import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CdkRoute53DdnsStack } from "../lib/cdk-route53-ddns-stack";

config();

const app = new cdk.App();
new CdkRoute53DdnsStack(app, "CdkRoute53DdnsStack", {
  env: {
    DDNS_USERNAME: process.env.DDNS_USERNAME as string,
    DDNS_PASSWORD: process.env.DDNS_PASSWORD as string,
  },
  tags: {
    app: "cdk-route53-ddns",
  },
});
