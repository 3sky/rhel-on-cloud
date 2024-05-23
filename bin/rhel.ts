#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SSHStack } from '../lib/ssh-stack';
import { ICStack } from '../lib/ic-stack';
import { SSMStack } from '../lib/ssm-stack';
import { SharedNetworkStack } from '../lib/shared-network';

const app = new cdk.App();

const network = new SharedNetworkStack(app, 'SharedNetworkStack');

const defaultInstanceProps = {
	vpc: network.vpc,
	machineImage: ec2.MachineImage.genericLinux({
		// amazon/RHEL-9.3.0_HVM-20240117-x86_64-49-Hourly2-GP3
		"eu-central-1": "ami-0134dde2b68fe1b07",
	}),
	instanceType: ec2.InstanceType.of(
		ec2.InstanceClass.BURSTABLE2,
		ec2.InstanceSize.MICRO,
	),
};

new SSHStack(app, 'SSHStack', {
	instanceProps: defaultInstanceProps,
	vpc: network.vpc,
});

new ICStack(app, 'ICStack', {
	instanceProps: defaultInstanceProps,
	vpc: network.vpc,
});


new SSMStack(app, 'SSMStack', {
	instanceProps: defaultInstanceProps,
});
