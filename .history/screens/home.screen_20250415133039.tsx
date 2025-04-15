const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());

// Sports detection helpers
const sportsTeams = {
  nba: 4,
  nfl: 2,
  mlb: 3,
  bulls: 4,
  lakers: 4,
  knicks: 4,
  warriors: 4,
  bears: 2,
  jets: 2,
  eagles: 2,
  yankees: 3,
  dodgers: 3,
};

const extractTeamAndType = (text) => {
  const lower = text.toLowerCase();
  let type = null;
  let teamKey = null;

  if (lower.includes('score')) type = 'scores';
  else if (lower.includes('schedule') || lower.includes('play next')) type = 'schedule';
  else if (lower.includes('summary')) type = 'summary';
  else if (lower.includes('odds') || lower.includes('betting')) type = 'odds';

  for (const key in sportsTeams) {
    if (lower.includes(key)) {
      teamKey = key;
      break;
    }
  }

  return { teamKey, type };
};

const fetchSportsData = async (teamKey, type) => {
  const sportId = sportsTeams[teamKey];
  const baseUrl = 'https://therundown-therundown-v1.p.rapidapi.com/sports';
  const today = new Date().toISOString().split('T')[0];

  const headers = {
    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
    'X-RapidAPI-Host': 'therundown-therundown-v1.p.rapidapi.com',
  };

  try {
    if (type === 'scores' || type === 'summary' || type === 'schedule') {
      const url = `${baseUrl}/${sportId}/events`; // fixed endpoint
      const res = await axios.get(url, { headers });
      const games = res.data.events || [];

      const teamGame = games.find((game) => {
        return (
          game.teams &&
          (game.teams.away.toLowerCase().includes(teamKey) ||
            game.teams.home.toLowerCase().includes(teamKey))
        );
      });

      if (!teamGame) return `No game found for ${teamKey}.`;

      if (type === 'scores') {
        return `${teamGame.teams.away} ${teamGame.score?.away ?? '?'} - ${teamGame.teams.home} ${teamGame.score?.home ?? '?'}`;
      }

      if (type === 'summary') {
        return `${teamGame.teams.away} vs ${teamGame.teams.home} — ${teamGame.event_status} on ${teamGame.event_date}`;
      }

      if (type === 'schedule') {
        return `${teamGame.teams.away} vs ${teamGame.teams.home} at ${teamGame.event_date}`;
      }
    } else if (type === 'odds') {
      const url = `${baseUrl}/${sportId}/odds`;
      const res = await axios.get(url, { headers });
      const games = res.data.games || [];
      const teamGame = games.find((game) => {
        return (
          game.teams &&
          (game.teams.away.toLowerCase().includes(teamKey) ||
            game.teams.home.toLowerCase().includes(teamKey))
        );
      });
      if (!teamGame) return `No odds found for ${teamKey}.`;
      return `${teamGame.teams.away} vs ${teamGame.teams.home} — spread: ${teamGame.odds.spread}, total: ${teamGame.odds.total}`;
    }

    return 'Sorry, I could not get the requested sports info.';
  } catch (error) {
    console.error('Score API error:', error?.response?.data || error.message);
    return 'Sorry, something went wrong getting sports info.';
  }
};

// Detect if it's weather or sports before fallback AI
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;

    const weatherMatch = prompt.match(/weather in ([a-zA-Z\s]+)/i);
    if (weatherMatch && weatherMatch[1]) {
      const city = weatherMatch[1].trim();
      const response = await axios.post(
        'https://hello-allie-backend.onrender.com/api/weather',
        { city },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return res.json({ result: response.data.result });
    }

    const { teamKey, type } = extractTeamAndType(prompt);
    if (teamKey && type) {
      const sportsResult = await fetchSportsData(teamKey, type);
      return res.json({ result: sportsResult });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    res.json({ result: completion.choices[0].message.content });
  } catch (error) {
    console.error('AI response error:', error.message);
    res.status(500).json({ error: 'Something went wrong with AI response' });
  }
});

// Whisper endpoint
const upload = multer({ dest: 'uploads/' });
app.post('/api/transcribe', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No audio file uploaded' });

    const newPath = `${file.path}.mp3`;
    fs.renameSync(file.path, newPath);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(newPath),
      model: 'whisper-1',
    });

    fs.unlinkSync(newPath);
    res.json({ text: transcription.text });
  } catch (error) {
    const message = error?.response?.data || error.message;
    console.error('Whisper transcription error:', message);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

// Weather proxy endpoint
app.post('/api/weather', async (req, res) => {
  try {
    const { city } = req.body;
    const weatherUrl = `https://open-weather13.p.rapidapi.com/city/${city}/EN`;
    const headers = {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'open-weather13.p.rapidapi.com',
    };
    const response = await axios.get(weatherUrl, { headers });
    const data = response.data;
    const weather = `The current weather in ${data.name}, ${data.sys.country} is ${data.weather[0].description} with a temperature of ${data.main.temp}°C.`;
    res.json({ result: weather });
  } catch (error) {
    console.error('Weather API error:', error?.response?.data || error.message);
    res.status(500).json({ result: `Sorry, I couldn't retrieve the weather.` });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

 















// Import core React Native components and other required libraries
// import {
//   Alert,
//   Image,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import React, { useState } from "react";
// import { LinearGradient } from "expo-linear-gradient";
// import { scale, verticalScale } from "react-native-size-matters";
// import FontAwesome from "@expo/vector-icons/FontAwesome";
// import { Audio } from "expo-av";
// import axios from "axios";
// import LottieView from "lottie-react-native";
// import * as Speech from "expo-speech";

// // Main screen component
// export default function HomeScreen() {
//   // State variables to track user input, response, and recording status
//   const [text, setText] = useState("");
//   const [response, setResponse] = useState("");
//   const [isRecording, setIsRecording] = useState(false);
//   const [recording, setRecording] = useState<Audio.Recording>();

//   // Request microphone permission from the user
//   const getMicrophonePermission = async () => {
//     try {
//       const { granted } = await Audio.requestPermissionsAsync();
//       if (!granted) {
//         Alert.alert("Permission", "Please grant permission to access microphone");
//         return false;
//       }
//       return true;
//     } catch (error) {
//       console.log("Microphone Permission Error:", error);
//       return false;
//     }
//   };

//   // Configuration for audio recording on Android and iOS
//   const recordingOptions: any = {
//     android: {
//       extension: ".m4a",
//       outputFormat: Audio.AndroidOutputFormat.MPEG_4,
//       audioEncoder: Audio.AndroidAudioEncoder.AAC,
//       sampleRate: 44100,
//       numberOfChannels: 1,
//       bitRate: 128000,
//     },
//     ios: {
//       extension: ".m4a",
//       audioQuality: Audio.IOSAudioQuality.HIGH,
//       sampleRate: 44100,
//       numberOfChannels: 1,
//       bitRate: 128000,
//       linearPCMBitDepth: 16,
//       linearPCMIsBigEndian: false,
//       linearPCMIsFloat: false,
//     },
//   };

//   // Start recording audio
//   const startRecording = async () => {
//     const hasPermission = await getMicrophonePermission();
//     if (!hasPermission) return;

//     try {
//       await Audio.setAudioModeAsync({
//         allowsRecordingIOS: true,
//         playsInSilentModeIOS: true,
//       });

//       setIsRecording(true);
//       const { recording } = await Audio.Recording.createAsync(recordingOptions);
//       setRecording(recording);
//     } catch (error) {
//       console.log("Failed to start recording:", error);
//       Alert.alert("Error", "Failed to start recording");
//     }
//   };

//   // Stop the recording and process the audio
//   const stopRecording = async () => {
//     try {
//       setIsRecording(false);
//       await recording?.stopAndUnloadAsync();
//       await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

//       const uri = recording?.getURI();
//       console.log("Audio File URI:", uri);

//       if (!uri) {
//         console.log("Error: Recording URI is undefined!");
//         return;
//       }

//       // Send to backend for transcription
//       const transcript = await sendAudioToWhisper(uri);
//       if (transcript) {
//         setText(transcript);

//         // Get AI-generated response based on transcript
//         const aiResponse = await getAIResponse(transcript);
//         setResponse(aiResponse);
//         Speech.speak(aiResponse); // Speak the response out loud
//       }
//     } catch (error) {
//       console.log("Failed to stop recording:", error);
//       Alert.alert("Error", "Failed to stop recording");
//     }
//   };

//   // Send audio to Whisper backend for transcription
//   const sendAudioToWhisper = async (uri: string) => {
//     try {
//       console.log("Sending audio to Whisper backend...");

//       const formData = new FormData();
//       formData.append("file", {
//         uri,
//         type: "audio/mpeg",
//         name: "recording.mp3",
//       } as any);

//       const response = await fetch(
//         "https://hello-allie-backend.onrender.com/api/transcribe",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "multipart/form-data",
//           },
//           body: formData,
//         }
//       );

//       const data = await response.json();
//       console.log("Transcription Response:", data);
//       return data.text;
//     } catch (error) {
//       console.log("Whisper Transcription Error:", error);
//       Alert.alert("Error", "Failed to transcribe audio");
//     }
//   };

//   // Fetch AI-generated response from backend
//   const getAIResponse = async (prompt: string) => {
//     try {
//       const response = await fetch(
//         "https://hello-allie-backend.onrender.com/api/generate",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ prompt }),
//         }
//       );

//       const data = await response.json();
//       console.log("AI response:", data.result);
//       return data.result;
//     } catch (error) {
//       console.error("AI Fetch Error:", error);
//       return "Sorry, something went wrong.";
//     }
//   };

//   return (
//     // Gradient background
//     <LinearGradient
//       colors={["#250152", "#000"]}
//       start={{ x: 0, y: 0 }}
//       end={{ x: 1, y: 1 }}
//       style={styles.container}
//     >
//       <StatusBar barStyle="light-content" />

//       {/* Background blur effects */}
//       <Image
//         source={require("@/assets/main/blur.png")}
//         style={{
//           position: "absolute",
//           right: scale(-15),
//           top: 0,
//           width: scale(240),
//         }}
//       />
//       <Image
//         source={require("@/assets/main/purple-blur.png")}
//         style={{
//           position: "absolute",
//           left: scale(-15),
//           bottom: verticalScale(100),
//           width: scale(210),
//         }}
//       />

//       {/* Mic button or animated recording UI */}
//       <View style={{ marginTop: verticalScale(-40) }}>
//         {!isRecording ? (
//           <TouchableOpacity style={styles.micButton} onPress={startRecording}>
//             <FontAwesome name="microphone" size={scale(50)} color="#2b3356" />
//           </TouchableOpacity>
//         ) : (
//           <TouchableOpacity onPress={stopRecording}>
//             <LottieView
//               source={require("@/assets/animations/animation.json")}
//               autoPlay
//               loop
//               speed={1.3}
//               style={{ width: scale(250), height: scale(250) }}
//             />
//           </TouchableOpacity>
//         )}
//       </View>

//       {/* Text display for transcript and AI response */}
//       <View style={styles.bottomTextContainer}>
//         <Text style={styles.instruction}>
//           Press the microphone to start recording!
//         </Text>
//         {text ? <Text style={styles.transcript}>You: {text}</Text> : null}
//         {response ? (
//           <Text style={styles.response}>Allie: {response}</Text>
//         ) : null}
//       </View>
//     </LinearGradient>
//   );
// }

// // Styling for the screen
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#131313",
//   },
//   micButton: {
//     width: scale(110),
//     height: scale(110),
//     backgroundColor: "#fff",
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     borderRadius: scale(100),
//   },
//   bottomTextContainer: {
//     alignItems: "center",
//     width: scale(350),
//     position: "absolute",
//     bottom: verticalScale(90),
//     gap: verticalScale(10),
//   },
//   instruction: {
//     color: "#fff",
//     fontSize: scale(16),
//     width: scale(269),
//     textAlign: "center",
//     lineHeight: 25,
//   },
//   transcript: {
//     color: "#9ddcff",
//     fontSize: scale(14),
//     fontStyle: "italic",
//   },
//   response: {
//     color: "#fff",
//     fontSize: scale(16),
//     textAlign: "center",
//     paddingHorizontal: scale(10),
//   },
// });














// import {
//   Alert,
//   Image,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import React, { useState } from "react";
// import { LinearGradient } from "expo-linear-gradient";
// import { scale, verticalScale } from "react-native-size-matters";
// import FontAwesome from "@expo/vector-icons/FontAwesome";
// import { Audio } from "expo-av";
// import axios from "axios";
// import LottieView from "lottie-react-native";
// import * as Speech from "expo-speech";
// import { getAIResponse } from "@/utils/openai";

// export default function HomeScreen() {
//   const [text, setText] = useState("");
//   const [response, setResponse] = useState("");
//   const [isRecording, setIsRecording] = useState(false);
//   const [recording, setRecording] = useState<Audio.Recording>();

//   const getMicrophonePermission = async () => {
//     try {
//       const { granted } = await Audio.requestPermissionsAsync();
//       if (!granted) {
//         Alert.alert("Permission", "Please grant permission to access microphone");
//         return false;
//       }
//       return true;
//     } catch (error) {
//       console.log("Microphone Permission Error:", error);
//       return false;
//     }
//   };

//   const recordingOptions: any = {
//     android: {
//       extension: ".m4a",
//       outputFormat: Audio.AndroidOutputFormat.MPEG_4,
//       audioEncoder: Audio.AndroidAudioEncoder.AAC,
//       sampleRate: 44100,
//       numberOfChannels: 1,
//       bitRate: 128000,
//     },
//     ios: {
//       extension: ".m4a",
//       audioQuality: Audio.IOSAudioQuality.HIGH,
//       sampleRate: 44100,
//       numberOfChannels: 1,
//       bitRate: 128000,
//       linearPCMBitDepth: 16,
//       linearPCMIsBigEndian: false,
//       linearPCMIsFloat: false,
//     },
//   };

//   const startRecording = async () => {
//     const hasPermission = await getMicrophonePermission();
//     if (!hasPermission) return;

//     try {
//       await Audio.setAudioModeAsync({
//         allowsRecordingIOS: true,
//         playsInSilentModeIOS: true,
//       });

//       setIsRecording(true);
//       const { recording } = await Audio.Recording.createAsync(recordingOptions);
//       setRecording(recording);
//     } catch (error) {
//       console.log("Failed to start recording:", error);
//       Alert.alert("Error", "Failed to start recording");
//     }
//   };

//   const stopRecording = async () => {
//     try {
//       setIsRecording(false);
//       await recording?.stopAndUnloadAsync();
//       await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

//       const uri = recording?.getURI();
//       console.log("Audio File URI:", uri);

//       if (!uri) {
//         console.log("Error: Recording URI is undefined!");
//         return;
//       }

//       const transcript = await sendAudioToWhisper(uri);
//       if (transcript) {
//         setText(transcript);

//         const aiResponse = await getAIResponse(transcript);
//         setResponse(aiResponse);
//         Speech.speak(aiResponse);
//       }
//     } catch (error) {
//       console.log("Failed to stop recording:", error);
//       Alert.alert("Error", "Failed to stop recording");
//     }
//   };

//   const sendAudioToWhisper = async (uri: string) => {
//     try {
//       console.log("Sending audio to Whisper...");

//       const formData = new FormData();
//       formData.append("file", {
//         uri,
//         type: "audio/m4a",
//         name: "recording.m4a",
//       } as any);

//       formData.append("model", "whisper-1");

//       const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
//       if (!apiKey) {
//         console.log("Error: API Key is missing!");
//         Alert.alert("Error", "Missing API Key");
//         return;
//       }

//       const response = await axios.post(
//         "https://api.openai.com/v1/audio/transcriptions",
//         formData,
//         {
//           headers: {
//             Authorization: `Bearer ${apiKey}`,
//             "Content-Type": "multipart/form-data",
//           },
//         }
//       );

//       console.log("Transcription Response:", response.data);
//       return response.data.text;
//     } catch (error: any) {
//       console.log("Error:", error.response ? error.response.data : error.message);
//       Alert.alert("Error", "Failed to process audio");
//     }
//   };

//   return (
//     <LinearGradient
//       colors={["#250152", "#000"]}
//       start={{ x: 0, y: 0 }}
//       end={{ x: 1, y: 1 }}
//       style={styles.container}
//     >
//       <StatusBar barStyle={"light-content"} />

//       <Image
//         source={require("@/assets/main/blur.png")}
//         style={{
//           position: "absolute",
//           right: scale(-15),
//           top: 0,
//           width: scale(240),
//         }}
//       />
//       <Image
//         source={require("@/assets/main/purple-blur.png")}
//         style={{
//           position: "absolute",
//           left: scale(-15),
//           bottom: verticalScale(100),
//           width: scale(210),
//         }}
//       />

//       <View style={{ marginTop: verticalScale(-40) }}>
//         {!isRecording ? (
//           <TouchableOpacity style={styles.micButton} onPress={startRecording}>
//             <FontAwesome name="microphone" size={scale(50)} color="#2b3356" />
//           </TouchableOpacity>
//         ) : (
//           <TouchableOpacity onPress={stopRecording}>
//             <LottieView
//               source={require("@/assets/animations/animation.json")}
//               autoPlay
//               loop
//               speed={1.3}
//               style={{ width: scale(250), height: scale(250) }}
//             />
//           </TouchableOpacity>
//         )}
//       </View>

//       <View style={styles.bottomTextContainer}>
//         <Text style={styles.instruction}>Press the microphone to start recording!</Text>
//         {text ? <Text style={styles.transcript}>You: {text}</Text> : null}
//         {response ? <Text style={styles.response}>Allie: {response}</Text> : null}
//       </View>
//     </LinearGradient>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#131313",
//   },
//   micButton: {
//     width: scale(110),
//     height: scale(110),
//     backgroundColor: "#fff",
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     borderRadius: scale(100),
//   },
//   bottomTextContainer: {
//     alignItems: "center",
//     width: scale(350),
//     position: "absolute",
//     bottom: verticalScale(90),
//     gap: verticalScale(10),
//   },
//   instruction: {
//     color: "#fff",
//     fontSize: scale(16),
//     width: scale(269),
//     textAlign: "center",
//     lineHeight: 25,
//   },
//   transcript: {
//     color: "#9ddcff",
//     fontSize: scale(14),
//     fontStyle: "italic",
//   },
//   response: {
//     color: "#fff",
//     fontSize: scale(16),
//     textAlign: "center",
//     paddingHorizontal: scale(10),
//   },
// });
