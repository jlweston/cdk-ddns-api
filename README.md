# CDK DDNS API

This is a CDK app that provides a REST API for Dynamic DNS updates. If you're running services locally that need to update their DNS records when your IP address changes, you can use this app to do so.

## Deploying the stack

- Update the .env file with a username and password to be used for authentication against the API.
- Run `npm install` to install the dependencies.
- (optional) Run `cdk synth` to generate the CloudFormation template - useful if you want to examine the template before deploying.
- Run `cdk deploy` to deploy the stack. Note down the API URL for use in the next section.

## Configuring `ddclient`

`ddclient` should come pre-installed on most Linux distributions. If yours does not include it, you can install it with `sudo apt-get install ddclient`.

To configure the client to use the API, edit the `/etc/ddclient.conf` file to include the following:

```apacheconf
protocol=dyndns2 # The protocol to use
use=web, web=checkip.dyndns.com # used to check the current IP address
ssl=yes
server=2j19bh391f.execute-api.eu-west-1.amazonaws.com # The URL of the API from the previous section
login='your-username-here' # The username from the previous section
password='your-password-here' # The password from the previous section
your-domain-here.com
another-domain.com
```

Save and close the file, then run `sudo service ddclient restart` to detect the new configuration. `ddclient` will now monitor your IP address and update your DNS records for all configured domains when it changes.
