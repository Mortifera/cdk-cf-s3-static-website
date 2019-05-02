import cdk = require('@aws-cdk/cdk');
import s3 = require('@aws-cdk/aws-s3');
import s3Deploy = require('@aws-cdk/aws-s3-deployment');
import cloudfront = require('@aws-cdk/aws-cloudfront');
export interface StaticWebsiteProps {
    bucketName: string;
    fullDomainName?: string;
    acmCertificateArn?: string;
    websiteRootIndexFile?: string;
    websiteRootErrorFile?: string;
    websiteSource: s3Deploy.ISource;
}
export declare class StaticWebsite extends cdk.Construct {
    cfDistribution: cloudfront.CfnDistribution;
    websiteBucket: s3.IBucket;
    constructor(scope: cdk.Construct, id: string, props: StaticWebsiteProps);
    _generateS3WebUrl(bucket: s3.IBucket): string;
}
