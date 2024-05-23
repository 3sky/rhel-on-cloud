import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam'

export interface SSMStackProps extends cdk.StackProps {
  instanceProps: any;
}
export class SSMStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SSMStackProps) {
    super(scope, id, props);

    const theProps = props.instanceProps;

    const ssmRole = new iam.Role(this, "SSMRole", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
      ],
      roleName: "SSMRole"
    });
    new iam.InstanceProfile(this, "SSMInstanceProfile", {
      role: ssmRole,
      instanceProfileName: "SSMInstanceProfile"
    });

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'set -o xtrace',
      'sudo dnf install -y https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_amd64/amazon-ssm-agent.rpm',
      'sudo systemctl enable amazon-ssm-agent',
      'sudo systemctl start amazon-ssm-agent'
    );


    const instnace = new ec2.Instance(this, 'instance-with-ssm', {
      instanceName: 'instance-with-ssm',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      role: ssmRole,
      allowAllOutbound: true,
      detailedMonitoring: true,
      userData: userData,
      ...theProps,
    });


    new cdk.CfnOutput(this, "HostID", {
      value: instnace.instanceId,
      description: "ID of the regular host",
    });

    new cdk.CfnOutput(this, "hostDNS", {
      value: instnace.instancePrivateDnsName,
      description: "Hostname of the regular host",
    });
  }
}
