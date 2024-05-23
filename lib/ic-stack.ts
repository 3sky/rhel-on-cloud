import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface ICStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  instanceProps: any;
}
export class ICStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ICStackProps) {
    super(scope, id, props);

    const theVPC = props.vpc;
    const theProps = props.instanceProps;

    const iceSG = new ec2.SecurityGroup(this, "iceSG", {
      securityGroupName: "Instance Connect SG",
      vpc: theVPC,
      allowAllOutbound: false
    });

    iceSG.addEgressRule(
      ec2.Peer.ipv4(theVPC.vpcCidrBlock),
      ec2.Port.tcp(22),
      "Allow outbound traffic from SG",
    );

    // WARNING: We need outbound traffic for package installation
    const iceSGtoVM = new ec2.SecurityGroup(this, "iceSGtoVM", {
      securityGroupName: "Allow access over instance connect",
      vpc: theVPC,
    });

    iceSGtoVM.addIngressRule(
      iceSG,
      ec2.Port.tcp(22),
      "Allow SSH traffic from iceSG",
    );

    new ec2.CfnInstanceConnectEndpoint(this, "myInstanceConnectEndpoint", {
      securityGroupIds: [iceSG.securityGroupId],
      subnetId: theVPC.privateSubnets[0].subnetId
    });

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'set -o xtrace',
      'mkdir /tmp/ec2-instance-connect',
      'curl https://amazon-ec2-instance-connect-us-west-2.s3.us-west-2.amazonaws.com/latest/linux_amd64/ec2-instance-connect.rpm -o /tmp/ec2-instance-connect/ec2-instance-connect.rpm',
      'curl https://amazon-ec2-instance-connect-us-west-2.s3.us-west-2.amazonaws.com/latest/linux_amd64/ec2-instance-connect-selinux.noarch.rpm -o /tmp/ec2-instance-connect/ec2-instance-connect-selinux.rpm',
      'sudo yum install -y /tmp/ec2-instance-connect/ec2-instance-connect.rpm /tmp/ec2-instance-connect/ec2-instance-connect-selinux.rpm'
    );

    const instnace = new ec2.Instance(this, 'instance-with-ic', {
      instanceName: 'instance-with-ic',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroup: iceSGtoVM,
      allowAllOutbound: true,
      detailedMonitoring: true,
      userData: userData,
      ...theProps,
    });

    new cdk.CfnOutput(this, "HostIP", {
      value: instnace.instanceId,
      description: "Public IP address of the regular host",
    });
  }
}
