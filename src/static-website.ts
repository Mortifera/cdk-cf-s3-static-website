import cdk = require('@aws-cdk/cdk');
import s3 = require('@aws-cdk/aws-s3');
import s3Deploy = require('@aws-cdk/aws-s3-deployment');
import cloudfront = require('@aws-cdk/aws-cloudfront');
import { ViewerProtocolPolicy, PriceClass } from '@aws-cdk/aws-cloudfront';

export interface StaticWebsiteProps {
    bucketName: string;
    fullDomainName?: string;
    acmCertificateArn?: string;
    websiteRootIndexFile?: string;
    websiteRootErrorFile?: string;
    websiteSource: s3Deploy.ISource;
}

export class StaticWebsite extends cdk.Construct {
    cfDistribution: cloudfront.CfnDistribution;
    websiteBucket: s3.IBucket;

    constructor(scope: cdk.Construct, id: string, props: StaticWebsiteProps) {
        super(scope, id);

        const websiteRootIndexFile = props.websiteRootIndexFile == undefined
                                        ? "index.html"
                                        : props.websiteRootIndexFile;

        this.websiteBucket = new s3.Bucket(this, "WebsiteBucket", {
            bucketName: props.bucketName,
            publicReadAccess: true,
            websiteIndexDocument: websiteRootIndexFile,
            websiteErrorDocument: props.websiteRootErrorFile == undefined
                                    ? websiteRootIndexFile
                                    : props.websiteRootErrorFile
        });
        
        new s3Deploy.BucketDeployment(this, "WebsiteBucketDeployment", {
            source: props.websiteSource,
            destinationBucket: this.websiteBucket
        });

        this.cfDistribution = new cloudfront.CfnDistribution(this, "WebsiteCloudfront", {
            distributionConfig: {
                comment: "Cloudfront distribution pointing to the website s3 bucket",
                origins: [
                    {
                        domainName: this._generateS3WebUrl(this.websiteBucket),
                        id: "S3Origin",
                        customOriginConfig: {
                            httpPort: 80,
                            httpsPort: 443,
                            originProtocolPolicy: "http-only"
                        }
                    }
                ],
                enabled: true,
                httpVersion: "http2",
                defaultRootObject: websiteRootIndexFile,
                aliases: props.fullDomainName == undefined
                            ? []
                            : [props.fullDomainName],
                defaultCacheBehavior: {
                    allowedMethods: ["GET", "HEAD"],
                    compress: true,
                    targetOriginId: "S3Origin",
                    forwardedValues: {
                        queryString: true,
                        cookies: {
                            forward: "none"
                        }
                    },
                    viewerProtocolPolicy: props.acmCertificateArn == undefined
                                            ? ViewerProtocolPolicy.AllowAll
                                            : ViewerProtocolPolicy.RedirectToHTTPS
                },
                priceClass: PriceClass.PriceClassAll,
                viewerCertificate: props.acmCertificateArn == undefined
                                    ? undefined
                                    : {
                                        acmCertificateArn: props.acmCertificateArn,
                                        sslSupportMethod: cloudfront.SSLMethod.SNI
                                    }
            }
        });
    }

    _generateS3WebUrl(bucket: s3.IBucket): string {
        return `${bucket.bucketName}.s3-website.${cdk.Stack.find(bucket).region}.${cdk.Stack.find(bucket).urlSuffix}`;
    }
   
}