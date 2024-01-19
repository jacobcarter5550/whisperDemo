import { useEffect, useState } from "react";
import OpenAI from "openai";

import { BallTriangle } from "react-loader-spinner";

export default function Home() {
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<any>([]);
  const [mediaRecorder, setMediaRecorder] = useState<any>(null);
  const [audioData, setAudioData] = useState<any>(null);

  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI,
    dangerouslyAllowBrowser: true,
  });

  useEffect(() => {
    // Request access to the microphone
    async function getMicrophoneAccess() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setMediaRecorder(new MediaRecorder(stream));
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    }

    getMicrophoneAccess();
  }, []);

  const startRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.start();
      console.log("Recording started");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      console.log("Recording stopped");
      mediaRecorder.ondataavailable = async (event: any) => {
        console.log("recorded");
        setAudioData(event.data);
        sendToWhisperAPI(event.data);
      };
    }
  };

  const key = process.env.NEXT_PUBLIC_OPENAI;

  const playTextAsAudio = async (text: string) => {
    const cResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k-0613",
      messages: [
        {
          role: "system",
          content: text,
        },
      ],
      temperature: 1,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    console.log(cResponse);

    const url = "https://api.openai.com/v1/audio/speech";
    const headers = {
      Authorization: `Bearer ${key}`, // Replace with your API key
      "Content-Type": "application/json",
    };
    const data = {
      model: "tts-1",
      input: cResponse.choices[0].message.content,
      voice: "echo",
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      setMessages((prevMessages: any) => [
        ...prevMessages,
        { role: "machine", content: cResponse.choices[0].message.content },
      ]);
      setLoading(false);
      audio.play();
    } catch (error) {
      console.error("Error playing text as audio:", error);
    }
  };

  const sendToWhisperAPI = async (data: any) => {
    const url = "https://api.openai.com/v1/audio/transcriptions";
    const headers = {
      Authorization: `Bearer ${key}`, // Replace with your API key
    };
    const formData = new FormData();
    formData.append("file", data, "filename.mp3"); // Append Blob with a filename
    formData.append("model", "whisper-1");

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: formData,
      });

      const result = await response.json();
      console.log(result);
      const transcribedText = result.text || "Transcription not available";

      // Call function to play text as audio
      setMessages((prevMessages: any) => [
        ...prevMessages,
        { role: "user", content: transcribedText },
      ]);
      setLoading(true);
      playTextAsAudio(transcribedText);
    } catch (error) {
      console.error("Error sending to Whisper API:", error);
    }
  };
  console.log(loading);
  return (
    <>
      <div>
        <button onClick={startRecording}>Startheydavid Recording</button>
        <button onClick={stopRecording}>Stop Recording</button>
        <button
          onClick={() => {
            console.log(audioData);
          }}
        >
          log itm
        </button>
        <div style={{ width: "70vw", margin: "0px auto" }}>
          {messages.map((message: any, ind: number) => {
            if (message.role === "user") {
              return (
                <p key={ind} style={{ textAlign: "right" }}>
                  {message.content}
                </p>
              );
            } else if (message.role === "machine") {
              return (
                <p key={ind} style={{ textAlign: "left" }}>
                  {message.content}
                </p>
              );
            }
          })}
        </div>
        {loading && <BallTriangle />}
      </div>
    </>
  );
}
