import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface SSHStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  instanceProps: any;
}
export class SSHStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SSHStackProps) {
    super(scope, id, props);

    const theVPC = props.vpc;
    const theProps = props.instanceProps;

    // WARNING: change key material to your own
    const awsKeyPair = new ec2.CfnKeyPair(this, "localkeypair", {
      publicKeyMaterial:
        "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJxYZEBNRLXmuign6ZgNbmaSK7cnQAgFpx8cCscoqVed local",
      keyName: "localawesomekey",
    });

    const myKeyPair = ec2.KeyPair.fromKeyPairAttributes(this, "mykey", {
      keyPairName: awsKeyPair.keyName,
    });

    const tooopenSG = new ec2.SecurityGroup(this, "tooopenSG", {
      securityGroupName: "Allow all SSH traffic",
      vpc: theVPC,
      allowAllOutbound: false
    });

    tooopenSG.addIngressRule(
      // NOTE: we should use more specific network range with
      // ec2.Peer.ipv4("x.x.x.x/24")
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "Allow SSH",
      false,
    );

    const defaultSG = new ec2.SecurityGroup(this, "regularSG", {
      securityGroupName: "Regular in-VPC SG",
      vpc: theVPC,
      allowAllOutbound: false
    });

    defaultSG.addIngressRule(
      ec2.Peer.ipv4(theVPC.vpcCidrBlock),
      ec2.Port.tcp(22),
      "Allow SSH inside VPC only"
    );


    const bastion = new ec2.Instance(this, 'bastion-host', {
      instanceName: 'bastion-host',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup: tooopenSG,
      keyPair: myKeyPair,
      ...theProps,
    });

    const instance = new ec2.Instance(this, 'host', {
      instanceName: 'host',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroup: defaultSG,
      keyPair: myKeyPair,
      ...theProps,
    });

    new cdk.CfnOutput(this, "bastionIP", {
      value: bastion.instancePublicIp,
      description: "Public IP address of the bastion host",
    });

    new cdk.CfnOutput(this, "instnaceIP", {
      value: instance.instancePrivateIp,
      description: "Private IP address of thsh host",
    });
  }
}
