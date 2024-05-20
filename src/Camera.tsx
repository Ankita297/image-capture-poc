// @ts-nocheck
import React, { useRef, useState, useEffect } from "react";

import "./styles.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CameraCapture = () => {
  const [error, setError] = useState(null);
  const [storageError,setStorageError]=useState(null)
  const [coordinates, setCoordinates] = useState({ lat: null, long: null });
  var options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
  };

  function success(pos) {
    let crd = pos.coords;
    console.log("Your current position is:");
    console.log(`Latitude : ${crd.latitude}`);
    console.log(`Longitude: ${crd.longitude}`);
    console.log(`More or less ${crd.accuracy} meters.`);
    setCoordinates({ lat: crd.latitude, long: crd.longitude });
  }
  function errors(err) {
    setError(err.message);
    console.warn(`ERROR(${err.code}): ${err.message}`);
  }


  const handleClickGeo = () => {
    if (navigator.geolocation) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then(function (result) {
          console.log(result);
          if (result.state === "granted") {
            //If granted then you can directly call your function here
            navigator.geolocation.getCurrentPosition(success, errors, options);
          } else if (result.state === "prompt") {
            //If prompt then the user will be asked to give permission
            navigator.geolocation.getCurrentPosition(success, errors, options);
          } else if (result.state === "denied") {
            //If denied then you have to show instructions to enable location
          }
        });
    } else {
      setError("Geolocation is not supported by this browser.");
      console.log("Geolocation is not supported by this browser.");
    }
  };

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [images, setImages] = React.useState(null);

  React.useEffect(()=>{
    const storedImages = JSON.parse(localStorage.getItem("images")) || [];
    setImages(storedImages);
  },[])

  const calculateSizeInKB = (base64String:string) => {
    // Remove the data URL part if present
    const base64 = base64String.split(",")[1];
    // Calculate the length of the Base64 string
    const stringLength = base64.length;
    // Each character represents 6 bits (3/4 of a byte)
    const byteLength = stringLength * (3 / 4);
    // Convert bytes to kilobytes
    const sizeKB = byteLength / 1024;
    return sizeKB.toFixed(2); // Return size in KB, rounded to 2 decimal places
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: 
           "environment" 
      });
      if (videoRef.current) {
        // @ts-ignore 
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing the camera", error);
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        let tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    
    const context = canvasRef.current.getContext("2d");
    context.drawImage(
      videoRef.current,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    const dataUrl = canvasRef.current.toDataURL("image/webp");
    toast("Captured !", {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });
    setImages((prev) => {
      try{
        localStorage.setItem("images",JSON.stringify([
          { src: dataUrl, size: calculateSizeInKB(dataUrl) },
          ...prev,
        ]))
        return [
        { src: dataUrl, size: calculateSizeInKB(dataUrl) },
        ...prev,
      ]
      }
    catch(err){
      setStorageError("Quota exceeded");
      console.log(err)
    }
  });

    startCamera();
    // Stop the video stream when the image is captured
    let tracks = videoRef.current.srcObject.getTracks();
    tracks.forEach((track) => track.stop());
  }

  return (
    <div className="container">
      {storageError && <p> {storageError} {JSON.parse(localStorage.getItem("images")).length}</p>}
        <h1>Location Access</h1>
      <button onClick={handleClickGeo}>Get location</button>
      {error ? (
        <div>{error}</div>
      ) : (
        coordinates.lat && (
          <div style={{ marginTop: "12px" }}>
            Lat: {coordinates.lat} , Long:{coordinates.long}
          </div>
        )
      )}
      <h1 style={{ textAlign: "center" }}>Native Camera POC </h1>
      <div className="container-view">
        <video ref={videoRef} autoPlay width="640" height="480"></video>
        <button onClick={handleCapture} className="capture-btn">
          Capture
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{ display: "none" }}
      ></canvas>
      <div className="images">
        {images?.length>0 && images.map((img, i) => (
          <div>
            <div style={{ textAlign: "center" }}>Size: {img.size}</div>
            <img key={i} src={img.src} alt="webcam" />
          </div>
        ))}
      </div>
      <ToastContainer />
    </div>
  );
};

export default CameraCapture;
