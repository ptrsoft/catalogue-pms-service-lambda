const { Client } = require("pg");
require("dotenv").config();

async function connectToDatabase() {
	try {
		const client = new Client({
			host: process.env.HOST,
			port: process.env.PORT,
			database: process.env.DATABASE,
			user: process.env.USER,
			password: process.env.PASSOWRD,
		});
		await client.connect();
		return client;
	} catch (error) {
		console.log("database :" + error.message);
	}
}

module.exports = {
	connectToDatabase,
};

(async () => {
	const c  = await connectToDatabase()
	console.log(c);
})()