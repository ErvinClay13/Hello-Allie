import {
  Alert,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { scale, verticalScale } from "react-native-size-matters";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Audio } from "expo-av";
import LottieView from "lottie-react-native";
import * as Speech from "expo-speech";

export default function HomeScreen() {
  const [text, setText] = useState("");
  const [response, setResponse] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording>();

  const getMicrophonePermission = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission", "Please grant permission to access microphone");
        return false;
      }
      return true;
    } catch (error) {
      console.log("Microphone Permission Error:", error);
      return false;
    }
  };

  const recordingOptions: any = {
    android: {
      extension: ".m4a",
      outputFormat: Audio.AndroidOutputFormat.MPEG_4,
      audioEncoder: Audio.AndroidAudioEncoder.AAC,
      sampleRate: 44100,
      numberOfChannels: 1,
      bitRate: 128000,
    },
    ios: {
      extension: ".m4a",
      audioQuality: Audio.IOSAudioQuality.HIGH,
      sampleRate: 44100,
      numberOfChannels: 1,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
  };

  const startRecording = async () => {
    const hasPermission = await getMicrophonePermission();
    if (!hasPermission) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      setIsRecording(true);
      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
    } catch (error) {
      console.log("Failed to start recording:", error);
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await recording?.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording?.getURI();
      console.log("Audio File URI:", uri);

      if (!uri) {
        console.log("Error: Recording URI is undefined!");
        return;
      }

      const transcript = await sendAudioToWhisper(uri);
      if (transcript) {
        setText(transcript);

        const aiResponse = await getSmartAIResponse(transcript);
        setResponse(aiResponse);
        Speech.speak(aiResponse);
      }
    } catch (error) {
      console.log("Failed to stop recording:", error);
      Alert.alert("Error", "Failed to stop recording");
    }
  };

  const sendAudioToWhisper = async (uri: string) => {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri,
        type: "audio/m4a",
        name: "recording.m4a",
      } as any);

      const response = await fetch("https://hello-allie-backend.onrender.com/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      const data = await response.json();
      return data.text;
    } catch (error) {
      console.log("Whisper Transcription Error:", error);
      Alert.alert("Error", "Failed to transcribe audio");
    }
  };

  const getSmartAIResponse = async (prompt: string) => {
    try {
      const res = await fetch("https://hello-allie-backend.onrender.com/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      return data.result || "Sorry, I couldn't get a response.";
    } catch (error) {
      console.error("Smart AI Fetch Error:", error);
      return "Sorry, something went wrong.";
    }
  };

  return (
    <LinearGradient
      colors={["#250152", "#000"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      <Image
        source={require("@/assets/main/blur.png")}
        style={{
          position: "absolute",
          right: scale(-15),
          top: 0,
          width: scale(240),
        }}
      />
      <Image
        source={require("@/assets/main/purple-blur.png")}
        style={{
          position: "absolute",
          left: scale(-15),
          bottom: verticalScale(100),
          width: scale(210),
        }}
      />

      <View style={{ marginTop: verticalScale(-40) }}>
        {!isRecording ? (
          <TouchableOpacity style={styles.micButton} onPress={startRecording}>
            <FontAwesome name="microphone" size={scale(50)} color="#2b3356" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={stopRecording}>
            <LottieView
              source={require("@/assets/animations/animation.json")}
              autoPlay
              loop
              speed={1.3}
              style={{ width: scale(250), height: scale(250) }}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.bottomTextContainer}>
        <Text style={styles.instruction}>Press the microphone to start recording!</Text>
        {text ? <Text style={styles.transcript}>You: {text}</Text> : null}
        {response ? <Text style={styles.response}>Allie: {response}</Text> : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#131313",
  },
  micButton: {
    width: scale(110),
    height: scale(110),
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: scale(100),
  },
  bottomTextContainer: {
    alignItems: "center",
    width: scale(350),
    position: "absolute",
    bottom: verticalScale(90),
    gap: verticalScale(10),
  },
  instruction: {
    color: "#fff",
    fontSize: scale(16),
    width: scale(269),
    textAlign: "center",
    lineHeight: 25,
  },
  transcript: {
    color: "#9ddcff",
    fontSize: scale(14),
    fontStyle: "italic",
  },
  response: {
    color: "#fff",
    fontSize: scale(16),
    textAlign: "center",
    paddingHorizontal: scale(10),
  },
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
