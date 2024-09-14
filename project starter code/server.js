import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import {filterImageFromURL, deleteLocalFiles, validateURL} from './util/util.js';



  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());
  // @TODO1 IMPLEMENT A RESTFUL ENDPOINT
  // GET /filteredimage?image_url={{URL}}
  // endpoint to filter an image from a public url.
  // IT SHOULD
  //    1. validate the image_url query ✅
  //    2. call filterImageFromURL(image_url) to filter the image ✅
  //    3. send the resulting file in the response ✅
  //    4. deletes any files on the server on finish of the response 
  // QUERY PARAMATERS
  //    image_url: URL of a publicly accessible image
  // RETURNS
  //   the filtered image file [!!TIP res.sendFile(filteredpath); might be useful]

    /**************************************************************************** */

  //! END @TODO1
  var uploaded_files = []

  app.get("/filteredimage", async (req, res) => {
    // On new requests, first clear, then start the process
    deleteLocalFiles(uploaded_files);
    var image_url = req.query.image_url;
    if (image_url) {
      if(await validateURL(image_url)) {
        try {
          const get_image = await axios.head(image_url);
          const contentType = get_image.headers['content-type'];
          if (!contentType.startsWith('image/')) {
            return res.status(415).send('URL does not point to an image.');
          }
          // The filter function only accepts jpg or pngs
          if (contentType !== 'image/jpeg' && contentType !== 'image/png') {
            return res.status(422).send('Only JPEG and PNG images are supported.');
          }
          var response = await filterImageFromURL(image_url);
          uploaded_files.push(response);
          return res.sendFile(response);
        } catch(error) {
          if(error.response && error.response.status === 403) {
            return res.status(403).send("The URL provided was not publicly accessible");
          }
          return res.status(400).send("The URL provided was invalid or not proccesible");
        }
      } else {
        return res.status(400).send("The provided image_url query is not");
      }
    } else {
      return res.status(400).send("There was no image_url provided");
    }
  });
  
  // Root Endpoint
  // Displays a simple message to the user
  app.get( "/", async (req, res) => {
    res.send("try GET /filteredimage?image_url={{}}")
  } );
  

  // Start the Server
  app.listen( port, () => {
      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  } );

  // for local clean up on control C
  process.on('SIGINT', function() {
    process.exit();
  });

  // for any reason the project exits, we want to delete local files
  process.on('exit', function() {
    deleteLocalFiles(uploaded_files);
  })