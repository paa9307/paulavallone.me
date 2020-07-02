  var app = app || {};

  app.utilities = (function(){
  
  // HELPER FUNCTIONS
        //draws the various components of the boat onscreen
        function drawBoat(drawCtx,peak,rotation) {
            //BOAT
            drawCtx.save();

            // drawCtx.translate(100, waveHeight - 25);//topSpacing + 256 - aData + 75
            drawCtx.translate(-85, 146 - peak / 3 + 100);

            drawCtx.strokeStyle = 'brown';
            drawCtx.fillStyle = 'burlyWood';
            drawCtx.rotate(rotation); //rotates the boat 

            //Boat Pole
            drawCtx.beginPath();
            drawCtx.rect(240, -30, 5, 140);
            drawCtx.stroke();
            drawCtx.fill();
            drawCtx.closePath();

            //Boat Sails
            drawCtx.save();
            drawCtx.strokeStyle = 'tan';
            drawCtx.fillStyle = 'beige';
            drawCtx.beginPath();
            drawCtx.moveTo(250, -30);
            drawCtx.lineTo(250, 70);
            drawCtx.lineTo(355, 98);
            drawCtx.stroke();
            drawCtx.fill();
            drawCtx.closePath();

            drawCtx.strokeStyle = 'tan';
            drawCtx.fillStyle = 'beige';
            drawCtx.beginPath();
            drawCtx.moveTo(250, -30);
            drawCtx.lineTo(280, 50);
            drawCtx.lineTo(380, 90);
            drawCtx.stroke();
            drawCtx.fill();
            drawCtx.closePath();


            drawCtx.strokeStyle = 'tan';
            drawCtx.fillStyle = 'beige';
            drawCtx.beginPath();
            drawCtx.moveTo(235, -30);
            drawCtx.lineTo(235, 70);
            drawCtx.lineTo(150, 50);
            drawCtx.stroke();
            drawCtx.fill();
            drawCtx.closePath();
            drawCtx.restore();

            //Boat Base
            drawCtx.beginPath();
            drawCtx.rect(100, 100, 150, 50);
            drawCtx.stroke();
            drawCtx.fill();
            drawCtx.closePath();

            //Boat Captains room
            drawCtx.beginPath();
            drawCtx.rect(100, 70, 75, 29);
            drawCtx.stroke();
            drawCtx.fill();
            drawCtx.closePath();

            drawCtx.beginPath();
            drawCtx.rect(95, 65, 85, 5);
            drawCtx.stroke();
            drawCtx.fill();
            drawCtx.closePath();

            drawCtx.save();
            drawCtx.fillStyle = 'brown';
            drawCtx.beginPath();
            drawCtx.rect(150, 75, 10, 24);
            drawCtx.stroke();
            drawCtx.fill();
            drawCtx.closePath();
            drawCtx.restore();

            //Boat front
            drawCtx.beginPath();
            drawCtx.moveTo(249, 100);
            drawCtx.lineTo(350, 100);
            drawCtx.lineTo(249, 150);
            drawCtx.stroke();
            drawCtx.fill();
            drawCtx.closePath();

            drawCtx.beginPath();
            drawCtx.moveTo(350, 100);
            drawCtx.lineTo(380, 95);
            drawCtx.stroke();
            drawCtx.closePath();

            //Boat Lines
            drawCtx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                drawCtx.beginPath();
                drawCtx.moveTo(100, 100 + (10 * i));
                drawCtx.lineTo(350 - (20 * i), 100 + (10 * i));
                drawCtx.stroke();
                drawCtx.closePath();
            }

            //Boat Windows
            for (let i = 0; i < 3; i++) {
                drawCtx.strokeStyle = 'grey';
                drawCtx.fillStyle = 'grey';
                drawCtx.beginPath();
                drawCtx.arc(150 + (i * 50), 120, 10, 0, 2 * Math.PI);
                drawCtx.stroke();
                drawCtx.fill();
                drawCtx.closePath();

                drawCtx.strokeStyle = 'black';
                drawCtx.fillStyle = 'black';
                drawCtx.beginPath();
                drawCtx.arc(150 + (i * 50), 120, 5, 0, 2 * Math.PI);
                drawCtx.stroke();
                drawCtx.fill();
                drawCtx.closePath();
            }
            drawCtx.restore();
        }

        function requestFullscreen(element) {
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.mozRequestFullscreen) {
                element.mozRequestFullscreen();
            } else if (element.mozRequestFullScreen) { // camel-cased 'S' was changed to 's' in spec
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            }
            // .. and do nothing if the method is not supported
        };

        //gets the data being displayed on the canvas in a pixel array modifies the pixels according to flag settings and then returns the altered pixel data
        function manipulatePixels(ctx,tint,invert,noise,sepia) {
            //28 - Get all of the rgba pixel data of the canvas by grabbing the ImageData Object
            //https://developer.mozilla.org/en-US/docs/Web/API/ImageData
            let imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);

            //29 - imageData.data is an 8-bit typed array - values range from 0-255
            //imageData.data contains 4 values per pixel: 4 x canvas.width x canvas.height = 1,024,000 values!
            //were looping through this 60 FPS - wow!
            let data = imageData.data;
            let length = data.length;
            let width = imageData.width;

            //30 - Iterate through each pixel
            //step through by 4 so that we can manipulate 1 pixel per iteration
            //data[i] is red
            //data[i+1] is green
            //data[i + 2] is blue
            //dat[i + 3] is alpha 

            let i; //declare i outside loop is optimization
            for (i = 0; i < length; i += 4) { //iterates by 4 to move one pixel at a time
                //31 - increase red values and green to produce a yellow tint
                if (tint) {
                    //just red this time
                    data[i] = data[i] + 100; //red
                    data[i+1] = data[i+1] + 100; //green
                    //data[i+2] = data[i+2] + 100; //blue

                }

                //32 - invert every color channel
                if (invert) {
                    let red = data[i], green = data[i + 1], blue = data[i + 2];
                    data[i] = 255 - red;
                    data[i + 1] = 255 - green;
                    data[i + 2] = 255 - blue;
                    //data[i+3] is the alpha but we're leaving that alone
                }

                //33- generates white noise
                if (noise && Math.random() < .10) {
                    // data[i] = data[i + 1] = data[i + 2] = 128; //gray noise
                    data[i] = data[i + 1] = data[i + 2] = 255; //or white noise
                    //data[i] = data[i+1] = data[i+2] = 0; //or black noise
                    //data[i] = 0; data[i + 1] = 0; data[i + 2] = 255; //or blue 
                    //data[i+3] = 255; //alpha
                }

                //34 - generates a sepia filter
                if (sepia) {
                    let tempRed = (data[i] * 0.393) + (data[i + 1] * 0.769) + (data[i + 2] * 0.189);
                    if (tempRed > 255) tempRed = 255;
                    let tempGreen = (data[i] * 0.393) + (data[i + 1] * 0.686) + (data[i + 2] * 0.168);
                    if (tempGreen > 255) tempGreen = 255;
                    let tempBlue = (data[i] * 0.272) + (data[i + 1] * 0.534) + (data[i + 2] * 0.131);
                    if (tempBlue > 255) tempBlue = 255;
                    data[i] = tempRed;
                    data[i + 1] = tempGreen;
                    data[i + 2] = tempBlue;
                }
            }

            //35 - put the modified data back on the canvas
            ctx.putImageData(imageData, 0, 0);
        }


        return{
            drawBoat,
            requestFullscreen,
            manipulatePixels
        };
    })();