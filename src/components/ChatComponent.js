import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Input } from "antd";
import { AudioOutlined } from "@ant-design/icons";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import Speech from "speak-tts";

const { Search } = Input; // ant design component

const DOMAIN = "http://localhost:5001"; // local domain for now

const searchContainer = {
  // display style
  display: "flex",
  justifyContent: "center",
};

const ChatComponent = (props) => {
  const { handleResp, isLoading, setIsLoading } = props;
  // Define a state variable to keep track of the search value
  const [searchValue, setSearchValue] = useState(""); //searchValue default value is ""
  // const [useVoiceInput, setUseVoiceInput] = useState(false); // New state to toggle between text and voice input
  const [isChatModeOn, setIsChatModeOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false); // set button to a different state
  const [speech, setSpeech] = useState(); // toggle text and speech,

  // speech recognition
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition(); // destructuring

  useEffect(() => {
    const speech = new Speech(); // Speech is from speak tts
    speech
      .init({
        volume: 1,
        lang: "en-US",
        rate: 1,
        pitch: 1,
        voice: "Google US English",
        splitSentences: true,
      })
      .then((data) => {
        // The "data" object contains the list of available voices and the voice synthesis params
        console.log("Speech is ready, voices are available", data);
        setSpeech(speech);
      })
      .catch((e) => {
        console.error("An error occured while initializing : ", e);
      });
  }, []);

  useEffect(() => {
    // !! converts transcript to boolean value
    // The double exclamation marks (!!) are used to convert the transcript variable into a boolean value. 
    // It will convert null, undefined, or an empty string to false, and any non-empty string will become true.
    if (!listening && !!transcript) {
      (async () => await onSearch(transcript))(); //IIFE when transcript changes, start search
      setIsRecording(false);
    }
  }, [listening, transcript]);

  const talk = (what2say) => {
    speech
      .speak({
        text: what2say,
        queue: false, // current speech will be interrupted,
        listeners: {
          onstart: () => {
            console.log("Start utterance");
          },
          onend: () => {
            console.log("End utterance");
          },
          onresume: () => {
            console.log("Resume utterance");
          },
          onboundary: (event) => {
            console.log(
              event.name +
                " boundary reached after " +
                event.elapsedTime +
                " milliseconds."
            );
          },
        },
      })
      .then(() => {
        // if everyting went well, start listening again
        console.log("Success !");
        userStartConvo();
      })
      .catch((e) => {
        console.error("An error occurred :", e);
      });
  };

  const userStartConvo = () => { // set browser continues to listen, no need to click button again
    SpeechRecognition.startListening();
    setIsRecording(true);
    resetEverything(); // could just reset transcript here, but could rope other stuff in as well, 
  };

  const resetEverything = () => {
    resetTranscript();
    // add other stuff here if want to reset in future
  };

  const chatModeClickHandler = () => {
    setIsChatModeOn(!isChatModeOn);
    setIsRecording(false);
    SpeechRecognition.stopListening();
  };

  const recordingClickHandler = () => {
    if (isRecording) { // if is recording now, 
      setIsRecording(false); // when click this button, stops recording
      SpeechRecognition.stopListening();
    } else { // if is not recording
      setIsRecording(true); // when 
      SpeechRecognition.startListening();
    }
  };

  const onSearch = async (question) => {
    // Clear the search input
    setSearchValue(""); // for better user experience
    setIsLoading(true); // indicates search is happening and will be load soon

    try {
      const response = await axios.get(`${DOMAIN}/chat`, {
        params: {
          question, // question: question
        },
      });
      handleResp(question, response.data);
      if (isChatModeOn) {
        talk(response.data);
      }
    } catch (error) {
      console.error(`Error: ${error}`);
      handleResp(question, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    // when user inputs, this func is called
    // Update searchValue state when the user types in the input box
    setSearchValue(e.target.value); // whenever searchvalue changes, react will re-render
    // this could be slow if change happens too fast
  };

  return (
    // render
    <div style={searchContainer}>
      {" "}
      {!isChatModeOn && (
        <Search
          placeholder="Type in Your Message"
          enterButton="Send"
          size="large"
          onSearch={() => onSearch(searchValue)} // event handler prop.
          loading={isLoading}
          value={searchValue} // Control the value
          onChange={handleChange} // Update the value when changed
          // This is another event handler.
          // It is triggered when the value in the search input change
          // disabled={useVoiceInput}
        />
      )}
      {/* <button onClick={() => setUseVoiceInput(!useVoiceInput)}>
        {useVoiceInput ? 'Voice Off' : 'Voice On'}
      </button> */}
      <Button
        type="primary"
        size="large"
        danger={isChatModeOn}
        onClick={chatModeClickHandler}
        style={{ marginLeft: "5px" }}
      >
        {isChatModeOn ? "Turn off Chat" : "Turn on Chat"}
      </Button>
      {isChatModeOn && (
        <Button
          type="primary"
          icon={<AudioOutlined />}
          size="large"
          danger={isRecording}
          onClick={recordingClickHandler}
          style={{ marginLeft: "5px" }}
        >
          {isRecording ? "Recording..." : "Click to record"}
        </Button>
      )}
    </div>
  );
};

export default ChatComponent;
