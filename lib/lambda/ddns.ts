import { APIGatewayProxyEventV2 } from "aws-lambda";
import { Route53 } from "aws-sdk";

type LambdaEvent = APIGatewayProxyEventV2 & {
  queryStringParameters: {
    [key: string]: string;
  };
};

type LambdaResult = {
  statusCode: number;
  body: string;
  headers?: {
    [key: string]: string;
  };
};

const route53 = new Route53();

const DEFAULT_TTL = 5 * 60; // 5 minutes

export const handler = async (event: LambdaEvent): Promise<LambdaResult> => {
  const { queryStringParameters: { myip: newIpAddress, hostname } = {} } =
    event;

  if (!newIpAddress) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing myip query string parameter",
      }),
    };
  }

  const hostnames = hostname
    .split(",")
    .map((hostname) => (hostname.endsWith(".") ? hostname : `${hostname}.`));

  if (!hostnames.length) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing hostname query string parameter",
      }),
    };
  }

  console.log(`Updating ${hostnames.length} hostnames`, {
    hostnames,
    newIp: newIpAddress,
  });

  try {
    for (const hostname of hostnames) {
      const zoneId = await findZoneId(hostname);
      await updateResourceRecord(zoneId, hostname, newIpAddress, DEFAULT_TTL);
      console.log(`Update complete for ${hostname} = ${newIpAddress}`);
    }
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify(error) };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/plain",
    },
    body: `good ${newIpAddress}\n`,
  };
};

const findZoneId = async (hostname: string): Promise<string> => {
  const { HostedZones } = await route53.listHostedZones().promise();

  const zone = HostedZones.find((zone) => hostname.endsWith(zone.Name));

  if (!zone) {
    throw new Error(`Could not find hosted zone for ${hostname}`);
  }

  return zone.Id;
};

const updateResourceRecord = async (
  zoneId: string,
  hostname: string,
  newIpAddress: string,
  ttl: number
) => {
  await route53
    .changeResourceRecordSets({
      HostedZoneId: zoneId,
      ChangeBatch: {
        Changes: [
          {
            Action: "UPSERT",
            ResourceRecordSet: {
              Name: hostname,
              Type: "A",
              TTL: ttl,
              ResourceRecords: [
                {
                  Value: newIpAddress,
                },
              ],
            },
          },
        ],
      },
    })
    .promise();
};
