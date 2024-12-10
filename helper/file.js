const AWS = require("aws-sdk");
AWS.config.update({
	accessKeyId: process.env.AWS_ACCESS_KEY,
	secretAccessKey: process.env.AWS_SEC_KEY,
	region: process.env.AWS_REG,
});
const s3 = new AWS.S3();
exports.uploadFile = async (file, filepath, fileName) => {
	try {
		const params = {
			Bucket: 'prince-bucket-1',
			Key: `${filepath}/${fileName}`,
			Body: file.buffer,
			ContentType: file.mimetype,
		};
		const res = await s3.upload(params).promise();
		return res.Key;
	} catch (error) {
		console.log(error);
	}
};
exports.fetchFile = async (filepath) => {
	try {
		const params = {
			Bucket: process.env.S3_BUCKET,
			Key: filepath,
		};
		console.log(params)
		const res = s3.getSignedUrl('getObject', params);
		return res;
	} catch (error) {
		return "";
	}
};
exports.deleteFile = async (filepath) => {
	try {
		const params = {
			Bucket: process.env.S3_BUCKET,
			Key: filepath,
		};
		const res = s3.deleteObject(params);
		if (res) {
			return true;
		}
		return false;
	} catch (error) {
		return false;
	}
}