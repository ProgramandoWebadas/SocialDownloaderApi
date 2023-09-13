
// En el servidor, utiliza require
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const youtubedownloader = require('./youtube.js');



const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());



app.get('/', (req, res) => {
    res.send("Downloader-Api");
});


app.post('/youtube', async (req, res) => {
	const { url } = req.body;
	const authorizationHeader = req.headers['authorization'];
	const expectedToken = process.env.API_TOKEN;
  
	if (authorizationHeader === expectedToken) {
	  try {
		const result = await youtubedownloader(url);
		if (result !== null) {
		  console.log(result);
		  res.status(200).json(result); 
		} else {
		  console.error('Hubo un error al ejecutar youtubedownloader.');
		  res.status(500).json({ success: false, message: 'Error' });
		}
	  } catch (error) {
		console.error(error);
		res.status(500).json({ success: false, message: 'Error' });
	  }
	} else {
	  res.status(401).json({ message: 'Token inválido' });
	}
  });
  
  
  
app.listen(3000, () => {
    console.log('Listening on port 3000');
});
