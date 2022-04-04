const checkEnvironmentVariables = (): void => {
  if (!process.env.DDNS_USERNAME) {
    throw new Error("DDNS_USERNAME is not set");
  }
  if (!process.env.DDNS_PASSWORD) {
    throw new Error("DDNS_PASSWORD is not set");
  }
};

export const handler = async (event: any) => {
  checkEnvironmentVariables();

  const authorizationHeader = event?.headers?.["Authorization"] as string;
  if (!authorizationHeader) {
    throw new Error("Authorization header is missing");
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Basic") {
    throw new Error("Authorization header is not Basic");
  }

  const decoded = Buffer.from(token, "base64").toString();
  const [username, password] = decoded.split(":");
  if (!username || !password) {
    throw new Error("Authorization token is invalid");
  }

  if (
    username !== process.env.DDNS_USERNAME ||
    password !== process.env.DDNS_PASSWORD
  ) {
    throw new Error("Authorization failed");
  }

  return {
    principalId: process.env["USERNAME"] as string,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: "Allow",
          Resource: event["methodArn"],
        },
      ],
    },
  };
};
