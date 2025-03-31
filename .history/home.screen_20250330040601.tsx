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
import axios from "axios";
import LottieView from "lottie-react-native";
import * as Speech from "expo-speech";
import { getAIResponse } from ".› Opening on Android...
› Opening exp://192.168.1.167:8082 on SM_G990U
› Press ? │ show all commands
Android Bundling failed 867ms node_modules\expo-router\entry.js (1361 modules)
Unable to resolve "@/utils/openai" from "screens\home.screen.tsx"
Android Bundled 3004ms node_modules\expo-router\entry.js (1448 modules)
 (NOBRIDGE) LOG  Bridgeless mode is enabled
 INFO 
 💡 JavaScript logs will be removed from Metro in React Native 0.77! Please use React Native DevTools as your default tool. Tip: Type j in the terminal to open (requires Google Chrome or Microsoft Edge).
 (NOBRIDGE) LOG  Audio File URI: file:///data/user/0/host.exp.exponent/cache/ExperienceData/%2540anonymous%252FHello-Allie-3710b999-6659-4078-a301-7e17ebb679d2/Audio/recording-42afb0cd-0719-4cf9-841b-3f686f0a3190.m4a  
 (NOBRIDGE) LOG  Sending audio to Whisper...
 (NOBRIDGE) LOG  Error: API Key is missing!
 (NOBRIDGE) LOG  Audio File URI: file:///data/user/0/host.exp.exponent/cache/ExperienceData/%2540anonymous%252FHello-Allie-3710b999-6659-4078-a301-7e17ebb679d2/Audio/recording-03335164-0f8a-4ebc-9279-43fdef4c1563.m4a  
 (NOBRIDGE) LOG  Sending audio to Whisper...
 (NOBRIDGE) LOG  Error: API Key is missing!../utils/openai";


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

        const aiResponse = await getAIResponse(transcript); // Secure backend call
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
      console.log("Sending audio to Whisper...");

      const formData = new FormData();
      formData.append("file", {
        uri,
        type: "audio/m4a",
        name: "recording.m4a",
      } as any);

      formData.append("model", "whisper-1");

      const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      if (!apiKey) {
        console.log("Error: API Key is missing!");
        Alert.alert("Error", "Missing API Key");
        return;
      }

      const response = await axios.post(
        "https://api.openai.com/v1/audio/transcriptions",
        formData,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Transcription Response:", response.data);
      return response.data.text;
    } catch (error: any) {
      console.log("Error:", error.response ? error.response.data : error.message);
      Alert.alert("Error", "Failed to process audio");
    }
  };

  return (
    <LinearGradient
      colors={["#250152", "#000"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle={"light-content"} />

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













// import {
//     Alert,
//     Image,
//     StatusBar,
//     StyleSheet,
//     Text,
//     TouchableOpacity,
//     View,
//   } from "react-native";
//   import React, { useState } from "react";
//   import { LinearGradient } from "expo-linear-gradient";
//   import { scale, verticalScale } from "react-native-size-matters";
//   import FontAwesome from "@expo/vector-icons/FontAwesome";
//   import { Audio } from "expo-av";
//   import axios from "axios";
//   import LottieView from "lottie-react-native";
//   import * as Speech from "expo-speech";
//   import { getAIResponse } from "@/utils/openai"; 

//   export default function HomeScreen() {
//     const [text, setText] = useState("");
//     const [response, setResponse] = useState("");
//     const [isRecording, setIsRecording] = useState(false);
//     const [recording, setRecording] = useState<Audio.Recording>();
  
//     const getMicrophonePermission = async () => {
//       try {
//         const { granted } = await Audio.requestPermissionsAsync();
//         if (!granted) {
//           Alert.alert("Permission", "Please grant permission to access microphone");
//           return false;
//         }
//         return true;
//       } catch (error) {
//         console.log("Microphone Permission Error:", error);
//         return false;
//       }
//     };
  
//     const recordingOptions: any = {
//         android: {
//           extension: ".m4a",
//           outputFormat: Audio.AndroidOutputFormat.MPEG_4,
//           audioEncoder: Audio.AndroidAudioEncoder.AAC,
//           sampleRate: 44100,
//           numberOfChannels: 1,
//           bitRate: 128000,
//         },
//         ios: {
//           extension: ".m4a",
//           audioQuality: Audio.IOSAudioQuality.HIGH,
//           sampleRate: 44100,
//           numberOfChannels: 1,
//           bitRate: 128000,
//           linearPCMBitDepth: 16,
//           linearPCMIsBigEndian: false,
//           linearPCMIsFloat: false,
//         },
//       };
      
  
//     const startRecording = async () => {
//       const hasPermission = await getMicrophonePermission();
//       if (!hasPermission) return;
  
//       try {
//         await Audio.setAudioModeAsync({
//           allowsRecordingIOS: true,
//           playsInSilentModeIOS: true,
//         });
  
//         setIsRecording(true);
//         const { recording } = await Audio.Recording.createAsync(recordingOptions);
//         setRecording(recording);
//       } catch (error) {
//         console.log("Failed to start recording:", error);
//         Alert.alert("Error", "Failed to start recording");
//       }
//     };
  
//     const stopRecording = async () => {
//       try {
//         setIsRecording(false);
//         await recording?.stopAndUnloadAsync();
//         await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
  
//         const uri = recording?.getURI();
//         console.log("Audio File URI:", uri);
  
//         if (!uri) {
//           console.log("Error: Recording URI is undefined!");
//           return;
//         }
  
//         const transcript = await sendAudioToWhisper(uri);
//         if (transcript) {
//           setText(transcript);
  
//           const aiResponse = await getAIResponse(transcript);
//           setResponse(aiResponse);
//           Speech.speak(aiResponse);
//         }
//       } catch (error) {
//         console.log("Failed to stop recording:", error);
//         Alert.alert("Error", "Failed to stop recording");
//       }
//     };
  
//     const sendAudioToWhisper = async (uri: string) => {
//       try {
//         console.log("Sending audio to Whisper...");
  
//         const formData = new FormData();
//         formData.append("file", {
//             uri,
//             type: "audio/m4a",
//             name: "recording.m4a", 
//           } as any);
          
  
//         formData.append("model", "whisper-1");
  
//         const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
//         if (!apiKey) {
//           console.log("Error: API Key is missing!");
//           Alert.alert("Error", "Missing API Key");
//           return;
//         }
  
//         const response = await axios.post(
//           "https://api.openai.com/v1/audio/transcriptions",
//           formData,
//           {
//             headers: {
//               Authorization: `Bearer ${apiKey}`,
//               "Content-Type": "multipart/form-data",
//             },
//           }
//         );
  
//         console.log("Transcription Response:", response.data);
//         return response.data.text;
//       } catch (error: any) {
//         console.log("Error:", error.response ? error.response.data : error.message);
//         Alert.alert("Error", "Failed to process audio");
//       }
//     };
  
//     return (
//       <LinearGradient
//         colors={["#250152", "#000"]}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 1 }}
//         style={styles.container}
//       >
//         <StatusBar barStyle={"light-content"} />
  
//         <Image
//           source={require("@/assets/main/blur.png")}
//           style={{
//             position: "absolute",
//             right: scale(-15),
//             top: 0,
//             width: scale(240),
//           }}
//         />
//         <Image
//           source={require("@/assets/main/purple-blur.png")}
//           style={{
//             position: "absolute",
//             left: scale(-15),
//             bottom: verticalScale(100),
//             width: scale(210),
//           }}
//         />
//         <View style={{ marginTop: verticalScale(-40) }}>
//           {!isRecording ? (
//             <TouchableOpacity
//               style={styles.micButton}
//               onPress={startRecording}
//             >
//               <FontAwesome name="microphone" size={scale(50)} color="#2b3356" />
//             </TouchableOpacity>
//           ) : (
//             <TouchableOpacity onPress={stopRecording}>
//               <LottieView
//                 source={require("@/assets/animations/animation.json")}
//                 autoPlay
//                 loop
//                 speed={1.3}
//                 style={{ width: scale(250), height: scale(250) }}
//               />
//             </TouchableOpacity>
//           )}
//         </View>
//         <View style={styles.bottomTextContainer}>
//           <Text style={styles.instruction}>Press the microphone to start recording!</Text>
//           {text ? <Text style={styles.transcript}>You: {text}</Text> : null}
//           {response ? <Text style={styles.response}>Allie: {response}</Text> : null}
//         </View>
//       </LinearGradient>
//     );
//   }
  
//   const styles = StyleSheet.create({
//     container: {
//       flex: 1,
//       justifyContent: "center",
//       alignItems: "center",
//       backgroundColor: "#131313",
//     },
//     micButton: {
//       width: scale(110),
//       height: scale(110),
//       backgroundColor: "#fff",
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "center",
//       borderRadius: scale(100),
//     },
//     bottomTextContainer: {
//       alignItems: "center",
//       width: scale(350),
//       position: "absolute",
//       bottom: verticalScale(90),
//       gap: verticalScale(10),
//     },
//     instruction: {
//       color: "#fff",
//       fontSize: scale(16),
//       width: scale(269),
//       textAlign: "center",
//       lineHeight: 25,
//     },
//     transcript: {
//       color: "#9ddcff",
//       fontSize: scale(14),
//       fontStyle: "italic",
//     },
//     response: {
//       color: "#fff",
//       fontSize: scale(16),
//       textAlign: "center",
//       paddingHorizontal: scale(10),
//     },
//   });
  














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
