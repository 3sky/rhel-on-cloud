import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class SharedNetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    cdk.Tags.of(this).add("description", "Shared Network");
    cdk.Tags.of(this).add("organization", "3sky.dev");
    cdk.Tags.of(this).add("owner", "3sky");

    this.vpc = new ec2.Vpc(this, 'TheVPC', {
      ipAddresses: ec2.IpAddresses.cidr("10.192.0.0/20"),
      maxAzs: 1,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      restrictDefaultSecurityGroup: true,
      subnetConfiguration: [
        {
          cidrMask: 28,
          name: "public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 28,
          name: "private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });
  }
}
