
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";

const API_BASE = "https://hello-allie-backend.onrender.com/api";

export default function HomeScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [selectedPersonality, setSelectedPersonality] = useState("friendly");
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setIsRecording(true);
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission required", "Microphone access is needed.");
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setIsLoading(true);
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) throw new Error("Recording URI not found");

      const formData = new FormData();
      formData.append("file", {
        uri,
        type: "audio/m4a",
        name: "recording.m4a",
      } as any);
      formData.append("language", selectedLanguage);

      const transcriptionRes = await fetch(`${API_BASE}/transcribe`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const { text } = await transcriptionRes.json();
      setTranscript(text);
      handleAIResponse(text);
    } catch (err) {
      console.error("Stop recording error", err);
      setIsLoading(false);
    }
  };

  const handleAIResponse = async (prompt: string) => {
    try {
      const res = await fetch(`${API_BASE}/smart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          personality: selectedPersonality,
          language: selectedLanguage,
        }),
      });
      const data = await res.json();
      setResponse(data.result);
      speak(data.result, selectedLanguage);
    } catch (err) {
      console.error("AI fetch error", err);
      Alert.alert("Error", "Something went wrong with AI response.");
    } finally {
      setIsLoading(false);
    }
  };

  const speak = (text: string, lang: string) => {
    Speech.stop();
    const voiceLang = lang === "es" ? "es-MX" : "en-US";
    const voiceName = lang === "es" ? undefined : "com.apple.ttsbundle.Samantha-compact";
    Speech.speak(text, {
      language: voiceLang,
      voice: voiceName,
      onDone: () => setIsLoading(false),
    });
  };

  const cancelSpeech = () => {
    Speech.stop();
    setIsLoading(false);
  };

  return (
    <LinearGradient colors={["#e7eaffff", "#c33764"]} style={styles.container}>
      <View style={styles.topBar}>
        <Picker
          selectedValue={selectedLanguage}
          style={styles.picker}
          onValueChange={(val: string) => setSelectedLanguage(val)}
        >
          <Picker.Item label="English" value="en" />
          <Picker.Item label="Español" value="es" />
        </Picker>
        <Picker
          selectedValue={selectedPersonality}
          style={styles.picker}
          onValueChange={(val: string) => setSelectedPersonality(val)}
        >
          <Picker.Item label="Friendly" value="friendly" />
          <Picker.Item label="Sassy" value="sassy" />
          <Picker.Item label="Motivational" value="motivational" />
          <Picker.Item label="Humorous" value="humorous" />
        </Picker>
      </View>

      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.transcript}>{transcript}</Text>
        <Text style={styles.response}>{response}</Text>
      </ScrollView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <TouchableOpacity onPress={cancelSpeech} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.micButton}
        onPress={isRecording ? stopRecording : startRecording}
      >
        <Ionicons name={isRecording ? "stop" : "mic"} size={32} color="#fff" />
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 50,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  picker: {
    width: 150,
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  scrollView: {
    padding: 20,
  },
  transcript: {
    fontSize: 16,
    color: "#eee",
    marginBottom: 10,
  },
  response: {
    fontSize: 18,
    color: "#fff",
  },
  micButton: {
    position: "absolute",
    bottom: 40,
    left: "50%",
    marginLeft: -30,
    backgroundColor: "#6200ee",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    marginTop: 20,
    backgroundColor: "#ff5252",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  cancelText: {
    color: "#fff",
    fontWeight: "bold",
  },
});






//8/13/2025
// import {
//   Alert,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
//   ScrollView,
//   ActivityIndicator,
// } from "react-native";
// import React, { useState, useCallback, useEffect, useRef } from "react";
// import { LinearGradient } from "expo-linear-gradient";
// import { scale, verticalScale } from "react-native-size-matters";
// import FontAwesome from "@expo/vector-icons/FontAwesome";
// import { Audio } from "expo-av";
// import LottieView from "lottie-react-native";
// import * as Speech from "expo-speech";
// import { useFocusEffect } from "@react-navigation/native";
// import { MotiView } from "moti";

 

// type Message = {
//   role: string;
//   content: string;
//   timestamp: number;
// };

// type ModeKey = "friendly" | "sassy" | "motivational" | "humorous";

// type RecordingInstance = InstanceType<typeof Audio.Recording>;

// export default function HomeScreen() {
//   const [text, setText] = useState("");
//   const [response, setResponse] = useState("");
//   const [isRecording, setIsRecording] = useState(false);
//   const [recording, setRecording] = useState<RecordingInstance | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSpeaking, setIsSpeaking] = useState(false);
//   const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
//   const [selectedPersonality, setSelectedPersonality] =
//     useState<ModeKey>("friendly");
//   const [modeIntro, setModeIntro] = useState("");
//   const [typingIndex, setTypingIndex] = useState(0);
//   const isInitialMount = useRef(true);
//   const [pendingDeleteOptions, setPendingDeleteOptions] = useState<any[]>([]);

//   const modeQuotes: Record<ModeKey, string> = {
//     friendly: "Hey there! Let’s make this a great chat!",
//     sassy: "Oh honey, buckle up. You picked the best version of me.",
//     motivational: "Let’s get to work. You’ve got greatness to unlock.",
//     humorous: "Why did the AI cross the road? To answer your questions, duh!",
//   };

//   useEffect(() => {
//     if (modeIntro === "") return;
//     setTypingIndex(0);
//     const interval = setInterval(() => {
//       setTypingIndex((prev) => {
//         if (prev >= modeIntro.length) {
//           clearInterval(interval);
//           return prev;
//         }
//         return prev + 1;
//       });
//     }, 30);
//     return () => clearInterval(interval);
//   }, [modeIntro]);

//   useFocusEffect(
//     useCallback(() => {
//       return () => {
//         Speech.stop();
//         setIsLoading(false);
//         setIsSpeaking(false);
//         if (recording) {
//           recording
//             .stopAndUnloadAsync()
//             .catch((e) => console.log("Error stopping recording:", e));
//           setRecording(null);
//           setIsRecording(false);
//         }
//       };
//     }, [recording])
//   );

//   const getMicrophonePermission = async (): Promise<boolean> => {
//     try {
//       const { granted } = await Audio.requestPermissionsAsync();
//       if (!granted) {
//         Alert.alert(
//           "Permission",
//           "Please grant permission to access microphone"
//         );
//         return false;
//       }
//       return true;
//     } catch (error) {
//       console.log("Microphone Permission Error:", error);
//       return false;
//     }
//   };

//   const recordingOptions: Audio.RecordingOptions = {
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
//     web: {} as any,
//   };

//   const startRecording = async () => {
//     if (isInitialMount.current) {
//       isInitialMount.current = false;
//       return;
//     }

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
//       if (!recording) return;

//       setIsRecording(false);
//       await recording.stopAndUnloadAsync();
//       await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

//       const uri = recording.getURI();
//       if (!uri) return;

//       setIsLoading(true);
//       const transcript = await sendAudioToWhisper(uri);
//       if (transcript) {
//         setText(transcript);

//         // === ✅ Updated delete confirmation block ===
//         if (pendingDeleteOptions.length && /^\d+$/.test(transcript.trim())) {
//           const selectedIndex = parseInt(transcript.trim(), 10) - 1;
//           console.log("Selected delete index:", selectedIndex); // Debug

//           if (
//             selectedIndex >= 0 &&
//             selectedIndex < pendingDeleteOptions.length
//           ) {
//             const selectedEvent = pendingDeleteOptions[selectedIndex];
//             console.log(
//               "Deleting event at index",
//               selectedIndex,
//               "with ID:",
//               selectedEvent.id
//             );

//             if (!selectedEvent.id) {
//               handleAIResponse({
//                 message:
//                   "Unable to find the selected event ID. Please try again.",
//               });
//               return;
//             }

//             const deletionResponse = await deleteScheduleEvent(
//               selectedEvent.id
//             );
//             setPendingDeleteOptions([]);
//             handleAIResponse({ message: deletionResponse });
//             return;
//           } else {
//             handleAIResponse({
//               message: "Invalid selection. Please try again.",
//             });
//             return;
//           }
//         }

//         const isScheduleCommand =
//           /remind me|schedule|add to calendar|what's my schedule|show schedule|list schedule|delete|remove/i.test(
//             transcript
//           );
//         let aiResponse;
//         if (isScheduleCommand) {
//           aiResponse = await sendSchedulePrompt(transcript);
//         } else {
//           aiResponse = await getSmartAIResponse(transcript);
//         }

//         handleAIResponse(aiResponse);
//       } else {
//         setIsLoading(false);
//       }
//     } catch (error) {
//       console.log("Failed to stop recording:", error);
//       Alert.alert("Error", "Failed to stop recording");
//       setIsLoading(false);
//     }
//   };

//   const handleAIResponse = (aiResponse: any) => {
//     setResponse(aiResponse.message || aiResponse);

//     if (aiResponse.options) setPendingDeleteOptions(aiResponse.options);
//     else setPendingDeleteOptions([]);

//     setConversationHistory((prev) => [
//       ...prev,
//       { role: "user", content: text, timestamp: Date.now() },
//       {
//         role: "assistant",
//         content: aiResponse.message || aiResponse,
//         timestamp: Date.now(),
//       },
//     ]);

//     setIsLoading(false);
//     setIsSpeaking(true);
//     Speech.speak(
//       (aiResponse.message || aiResponse).replace(/[\u{1F600}-\u{1F64F}]/gu, ""),
//       { onDone: speechDoneHandler }
//     );
//   };

//   const sendAudioToWhisper = async (
//     uri: string
//   ): Promise<string | undefined> => {
//     try {
//       const formData = new FormData();
//       formData.append("file", {
//         uri,
//         type: "audio/m4a",
//         name: "recording.m4a",
//       } as any);

//       const response = await fetch(
//         "https://hello-allie-backend.onrender.com/api/transcribe",
//         {
//           method: "POST",
//           headers: { "Content-Type": "multipart/form-data" },
//           body: formData,
//         }
//       );

//       const data = await response.json();
//       return data.text;
//     } catch (error) {
//       console.log("Whisper Transcription Error:", error);
//       Alert.alert("Error", "Failed to transcribe audio");
//     }
//   };

//   const getSmartAIResponse = async (prompt: string): Promise<string> => {
//     try {
//       const res = await fetch(
//         "https://hello-allie-backend.onrender.com/api/smart",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             prompt,
//             conversationHistory,
//             mode: selectedPersonality,
//           }),
//         }
//       );
//       const data = await res.json();
//       return data.result || "Sorry, something went wrong.";
//     } catch (error) {
//       console.error("Smart AI Fetch Error:", error);
//       return "Sorry, something went wrong.";
//     }
//   };

//   const sendSchedulePrompt = async (prompt: string): Promise<any> => {
//     try {
//       const isDeleteCommand = /delete|remove/i.test(prompt);
//       const endpoint = isDeleteCommand
//         ? "https://hello-allie-backend.onrender.com/api/schedule/delete"
//         : "https://hello-allie-backend.onrender.com/api/schedule";

//       const res = await fetch(endpoint, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ prompt }),
//       });

//       const data = await res.json();
//       return data;
//     } catch (error) {
//       console.error("Smart Scheduling Fetch Error:", error);
//       return "Sorry, scheduling failed.";
//     }
//   };

//   const deleteScheduleEvent = async (eventId: string): Promise<string> => {
//     try {
//       const res = await fetch(
//         "https://hello-allie-backend.onrender.com/api/schedule/delete",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ id: eventId }),
//         }
//       );
//       const data = await res.json();
//       return data.message || "Deleted.";
//     } catch (error) {
//       console.error("Delete Event Error:", error);
//       return "Failed to delete event.";
//     }
//   };

//   const speechDoneHandler = () => {
//     setIsSpeaking(false);
//     Audio.setAudioModeAsync({
//       allowsRecordingIOS: true,
//       playsInSilentModeIOS: true,
//     }).catch((error) =>
//       console.log("Audio reset error after speaking:", error)
//     );
//   };

//   const cancelSpeaking = async () => {
//     Speech.stop();
//     setIsSpeaking(false);
//     setIsLoading(false);
//     try {
//       await Audio.setAudioModeAsync({
//         allowsRecordingIOS: false,
//         playsInSilentModeIOS: true,
//       });
//     } catch (error) {
//       console.log("Audio mode reset error on cancel:", error);
//     }
//   };

//   return (
//     <LinearGradient colors={["#250152", "#000"]} style={styles.container}>
//       <StatusBar barStyle="light-content" />
//       <ScrollView contentContainerStyle={styles.scrollContainer}>
//         {modeIntro && (
//           <Text style={styles.modeIntro}>
//             {modeIntro.slice(0, typingIndex)}
//           </Text>
//         )}
//         <View style={{ height: verticalScale(20) }} />
//         {text ? <Text style={styles.transcript}>You: {text}</Text> : null}
//         {response ? (
//           <Text style={styles.response}>Allie: {response}</Text>
//         ) : null}
//       </ScrollView>

//       <View style={styles.modeButtons}>
//         {(Object.keys(modeQuotes) as ModeKey[]).map((mode) => (
//           <MotiView
//             key={mode}
//             from={{ scale: 1 }}
//             animate={{ scale: selectedPersonality === mode ? 1.2 : 1 }}
//             transition={{ type: "spring" }}
//           >
//             <TouchableOpacity
//               onPress={() => {
//                 setSelectedPersonality(mode);
//                 setModeIntro(modeQuotes[mode]);
//               }}
//               style={[
//                 styles.modeButton,
//                 selectedPersonality === mode && styles.activeModeButton,
//               ]}
//             >
//               <Text style={styles.modeText}>{mode}</Text>
//             </TouchableOpacity>
//           </MotiView>
//         ))}
//       </View>

//       <View style={styles.micContainer}>
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

//         {(isLoading || isSpeaking) && (
//           <TouchableOpacity onPress={cancelSpeaking} style={{ marginTop: 10 }}>
//             <Text style={{ color: "#ff6464", fontSize: 16 }}>Cancel</Text>
//           </TouchableOpacity>
//         )}

//         {isLoading && (
//           <View style={{ marginTop: 10 }}>
//             <ActivityIndicator size="large" color="#fff" />
//           </View>
//         )}
//       </View>
//     </LinearGradient>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, paddingTop: verticalScale(50) },
//   scrollContainer: { paddingHorizontal: scale(20), alignItems: "center" },
//   modeIntro: {
//     color: "#fff",
//     fontSize: scale(16),
//     marginBottom: verticalScale(10),
//     textAlign: "center",
//   },
//   transcript: {
//     color: "#9ddcff",
//     fontSize: scale(14),
//     fontStyle: "italic",
//     marginBottom: verticalScale(5),
//   },
//   response: {
//     color: "#fff",
//     fontSize: scale(16),
//     textAlign: "center",
//     paddingHorizontal: scale(10),
//   },
//   modeButtons: {
//     flexDirection: "row",
//     justifyContent: "space-around",
//     marginTop: verticalScale(20),
//     marginBottom: verticalScale(10),
//   },
//   modeButton: { backgroundColor: "#333", padding: 10, borderRadius: 20 },
//   activeModeButton: { backgroundColor: "#7f5af0" },
//   modeText: { color: "#fff", textTransform: "capitalize" },
//   micContainer: { alignItems: "center", marginTop: verticalScale(10) },
//   micButton: {
//     width: scale(110),
//     height: scale(110),
//     backgroundColor: "#fff",
//     alignItems: "center",
//     justifyContent: "center",
//     borderRadius: scale(100),
//   },
// });










6 / 28 / 25;
// import {
//   Alert,
//   Image,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
//   ScrollView,
//   ActivityIndicator,
// } from "react-native";
// import React, { useState, useCallback, useEffect, useRef } from "react";
// import { LinearGradient } from "expo-linear-gradient";
// import { scale, verticalScale } from "react-native-size-matters";
// import FontAwesome from "@expo/vector-icons/FontAwesome";
// import { Audio, AVPlaybackStatus, AVPlaybackSource } from "expo-av";
// import LottieView from "lottie-react-native";
// import * as Speech from "expo-speech";
// import { useFocusEffect } from "@react-navigation/native";
// import { MotiView } from "moti";

// // TYPES

// type Message = {
//   role: string;
//   content: string;
//   timestamp: number;
// };

// type ModeKey = 'friendly' | 'sassy' | 'motivational' | 'humorous';

// type RecordingInstance = InstanceType<typeof Audio.Recording>;

// export default function HomeScreen() {
//   const [text, setText] = useState<string>("");
//   const [response, setResponse] = useState<string>("");
//   const [isRecording, setIsRecording] = useState<boolean>(false);
//   const [recording, setRecording] = useState<RecordingInstance | null>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
//   const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
//   const [selectedPersonality, setSelectedPersonality] = useState<ModeKey>("friendly");
//   const [modeIntro, setModeIntro] = useState<string>("");
//   const [typingIndex, setTypingIndex] = useState<number>(0);
//   const isInitialMount = useRef(true);

//   const modeQuotes: Record<ModeKey, string> = {
//     friendly: "Hey there! Let’s make this a great chat!",
//     sassy: "Oh honey, buckle up. You picked the best version of me.",
//     motivational: "Let’s get to work. You’ve got greatness to unlock.",
//     humorous: "Why did the AI cross the road? To answer your questions, duh!",
//   };

//   useEffect(() => {
//     if (modeIntro === "") return;
//     setTypingIndex(0);

//     const interval = setInterval(() => {
//       setTypingIndex((prev) => {
//         if (prev >= modeIntro.length) {
//           clearInterval(interval);
//           return prev;
//         }
//         return prev + 1;
//       });
//     }, 30);

//     return () => clearInterval(interval);
//   }, [modeIntro]);

//   useFocusEffect(
//     useCallback(() => {
//       return () => {
//         Speech.stop();
//         setIsLoading(false);
//         setIsSpeaking(false);
//         if (recording) {
//           recording.stopAndUnloadAsync().catch((e: any) => console.log("Error stopping recording:", e));
//           setRecording(null);
//           setIsRecording(false);
//         }
//       };
//     }, [recording])
//   );

//   useEffect(() => {
//     const interval = setInterval(() => {
//       const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
//       setConversationHistory((prev) => prev.filter((entry) => entry.timestamp > thirtyMinutesAgo));
//     }, 60000);
//     return () => clearInterval(interval);
//   }, []);

//   const getMicrophonePermission = async (): Promise<boolean> => {
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

//   const recordingOptions: Audio.RecordingOptions = {
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
//     web: {} as any,
//   };

//   const startRecording = async () => {
//     if (isInitialMount.current) {
//       isInitialMount.current = false;
//       return;
//     }

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
//       if (!recording) return;

//       setIsRecording(false);
//       await recording.stopAndUnloadAsync();
//       await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

//       const uri = recording.getURI();
//       if (!uri) return;

//       setIsLoading(true);
//       const transcript = await sendAudioToWhisper(uri);
//       if (transcript) {
//         setText(transcript);

//         const aiResponse = await getSmartAIResponse(transcript);
//         setResponse(aiResponse);

//         setConversationHistory((prev) => [
//           ...prev,
//           { role: "user", content: transcript, timestamp: Date.now() },
//           { role: "assistant", content: aiResponse, timestamp: Date.now() },
//         ]);

//         setIsLoading(false);
//         setIsSpeaking(true);
//         Speech.speak(aiResponse, {
//           onDone: speechDoneHandler,
//         });
//       } else {
//         setIsLoading(false);
//       }
//     } catch (error) {
//       console.log("Failed to stop recording:", error);
//       Alert.alert("Error", "Failed to stop recording");
//       setIsLoading(false);
//     }
//   };

//   const speechDoneHandler = () => {
//     setIsSpeaking(false);
//     Audio.setAudioModeAsync({
//       allowsRecordingIOS: true,
//       playsInSilentModeIOS: true,
//     }).catch((error) => {
//       console.log("Audio reset error after speaking:", error);
//     });
//   };

//   const sendAudioToWhisper = async (uri: string): Promise<string | undefined> => {
//     try {
//       const formData = new FormData();
//       formData.append("file", {
//         uri,
//         type: "audio/m4a",
//         name: "recording.m4a",
//       } as any);

//       const response = await fetch("https://hello-allie-backend.onrender.com/api/transcribe", {
//         method: "POST",
//         headers: { "Content-Type": "multipart/form-data" },
//         body: formData,
//       });

//       const data = await response.json();
//       return data.text;
//     } catch (error) {
//       console.log("Whisper Transcription Error:", error);
//       Alert.alert("Error", "Failed to transcribe audio");
//     }
//   };

//   const getSmartAIResponse = async (prompt: string): Promise<string> => {
//     try {
//       const res = await fetch("https://hello-allie-backend.onrender.com/api/smart", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ prompt, conversationHistory, mode: selectedPersonality }),
//       });
//       const data = await res.json();
//       return data.result || "Sorry, something went wrong.";
//     } catch (error) {
//       console.error("Smart AI Fetch Error:", error);
//       return "Sorry, something went wrong.";
//     }
//   };

//   const cancelSpeaking = async () => {
//     Speech.stop();
//     setIsSpeaking(false);
//     setIsLoading(false);

//     try {
//       await Audio.setAudioModeAsync({
//         allowsRecordingIOS: false,
//         playsInSilentModeIOS: true,
//       });
//     } catch (error) {
//       console.log("Audio mode reset error on cancel:", error);
//     }
//   };

//   return (
//     <LinearGradient colors={["#250152", "#000"]} style={styles.container}>
//       <StatusBar barStyle="light-content" />

//       <ScrollView contentContainerStyle={styles.scrollContainer}>
//         {modeIntro && (
//           <Text style={styles.modeIntro}>{modeIntro.slice(0, typingIndex)}</Text>
//         )}

//         <View style={{ height: verticalScale(20) }} />

//         {text ? <Text style={styles.transcript}>You: {text}</Text> : null}
//         {response ? <Text style={styles.response}>Allie: {response}</Text> : null}
//       </ScrollView>

//       <View style={styles.modeButtons}>
//         {(Object.keys(modeQuotes) as ModeKey[]).map((mode) => (
//           <MotiView
//             key={mode}
//             from={{ scale: 1 }}
//             animate={{ scale: selectedPersonality === mode ? 1.2 : 1 }}
//             transition={{ type: "spring" }}
//           >
//             <TouchableOpacity
//               onPress={() => {
//                 setSelectedPersonality(mode);
//                 setModeIntro(modeQuotes[mode]);
//               }}
//               style={[styles.modeButton, selectedPersonality === mode && styles.activeModeButton]}
//             >
//               <Text style={styles.modeText}>{mode}</Text>
//             </TouchableOpacity>
//           </MotiView>
//         ))}
//       </View>

//       <View style={styles.micContainer}>
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

//         {(isLoading || isSpeaking) && (
//           <TouchableOpacity onPress={cancelSpeaking} style={{ marginTop: 10 }}>
//             <Text style={{ color: "#ff6464", fontSize: 16 }}>Cancel</Text>
//           </TouchableOpacity>
//         )}

//         {isLoading && (
//           <View style={{ marginTop: 10 }}>
//             <ActivityIndicator size="large" color="#fff" />
//           </View>
//         )}
//       </View>
//     </LinearGradient>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingTop: verticalScale(50),
//   },
//   scrollContainer: {
//     paddingHorizontal: scale(20),
//     alignItems: "center",
//   },
//   modeIntro: {
//     color: "#fff",
//     fontSize: scale(16),
//     marginBottom: verticalScale(10),
//     textAlign: "center",
//   },
//   transcript: {
//     color: "#9ddcff",
//     fontSize: scale(14),
//     fontStyle: "italic",
//     marginBottom: verticalScale(5),
//   },
//   response: {
//     color: "#fff",
//     fontSize: scale(16),
//     textAlign: "center",
//     paddingHorizontal: scale(10),
//   },
//   modeButtons: {
//     flexDirection: "row",
//     justifyContent: "space-around",
//     marginTop: verticalScale(20),
//     marginBottom: verticalScale(10),
//   },
//   modeButton: {
//     backgroundColor: "#333",
//     padding: 10,
//     borderRadius: 20,
//   },
//   activeModeButton: {
//     backgroundColor: "#7f5af0",
//   },
//   modeText: {
//     color: "#fff",
//     textTransform: "capitalize",
//   },
//   micContainer: {
//     alignItems: "center",
//     marginTop: verticalScale(10),
//   },
//   micButton: {
//     width: scale(110),
//     height: scale(110),
//     backgroundColor: "#fff",
//     alignItems: "center",
//     justifyContent: "center",
//     borderRadius: scale(100),
//   },
// });

//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
//   ScrollView,
//   ActivityIndicator,
// } from "react-native";
// import React, { useState, useCallback, useEffect } from "react";
// import { LinearGradient } from "expo-linear-gradient";
// import { scale, verticalScale } from "react-native-size-matters";
// import FontAwesome from "@expo/vector-icons/FontAwesome";
// import { Audio } from "expo-av";
// import LottieView from "lottie-react-native";
// import * as Speech from "expo-speech";
// import { useFocusEffect } from "@react-navigation/native";

// export default function HomeScreen() {
//   const [text, setText] = useState("");
//   const [response, setResponse] = useState("");
//   const [isRecording, setIsRecording] = useState(false);
//   const [recording, setRecording] = useState<Audio.Recording | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSpeaking, setIsSpeaking] = useState(false);
//   const [conversationHistory, setConversationHistory] = useState<{ role: string; content: string; timestamp: number }[]>([]);

//   useFocusEffect(
//     useCallback(() => {
//       return () => {
//         Speech.stop();
//         setIsLoading(false);
//         setIsSpeaking(false);
//         if (recording) {
//           recording.stopAndUnloadAsync().catch((e) => console.log("Error stopping recording:", e));
//           setRecording(null);
//           setIsRecording(false);
//         }
//       };
//     }, [recording])
//   );

//   useEffect(() => {
//     const interval = setInterval(() => {
//       const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
//       setConversationHistory(prev => prev.filter(entry => entry.timestamp > thirtyMinutesAgo));
//     }, 60000);
//     return () => clearInterval(interval);
//   }, []);

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

//   const recordingOptions: Audio.RecordingOptions = {
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
//     web: {} as Audio.RecordingOptionsWeb,
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
//       if (!recording) return;

//       setIsRecording(false);
//       await recording.stopAndUnloadAsync();
//       await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

//       const uri = recording.getURI();
//       if (!uri) return;

//       setIsLoading(true);
//       const transcript = await sendAudioToWhisper(uri);
//       if (transcript) {
//         setText(transcript);

//         const aiResponse = await getSmartAIResponse(transcript);
//         setResponse(aiResponse);

//         setConversationHistory(prev => [...prev, { role: "user", content: transcript, timestamp: Date.now() }, { role: "assistant", content: aiResponse, timestamp: Date.now() }]);

//         setIsLoading(false);
//         setIsSpeaking(true);
//         Speech.speak(aiResponse, {
//           onDone: () => {
//             setIsSpeaking(false);
//             Audio.setAudioModeAsync({
//               allowsRecordingIOS: false,
//               playsInSilentModeIOS: true,
//             }).catch((error) => console.log("Audio reset error after speaking:", error));
//           },
//         });
//       } else {
//         setIsLoading(false);
//       }
//     } catch (error) {
//       console.log("Failed to stop recording:", error);
//       Alert.alert("Error", "Failed to stop recording");
//       setIsLoading(false);
//     }
//   };

//   const sendAudioToWhisper = async (uri: string) => {
//     try {
//       const formData = new FormData();
//       formData.append("file", {
//         uri,
//         type: "audio/m4a",
//         name: "recording.m4a",
//       } as any);

//       const response = await fetch("https://hello-allie-backend.onrender.com/api/transcribe", {
//         method: "POST",
//         headers: { "Content-Type": "multipart/form-data" },
//         body: formData,
//       });

//       const data = await response.json();
//       return data.text;
//     } catch (error) {
//       console.log("Whisper Transcription Error:", error);
//       Alert.alert("Error", "Failed to transcribe audio");
//     }
//   };

//   const getSmartAIResponse = async (prompt: string) => {
//     try {
//       const res = await fetch("https://hello-allie-backend.onrender.com/api/smart", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ prompt, conversationHistory }),
//       });
//       const data = await res.json();
//       return data.result || "Sorry, something went wrong.";
//     } catch (error) {
//       console.error("Smart AI Fetch Error:", error);
//       return "Sorry, something went wrong.";
//     }
//   };

//   const cancelSpeaking = async () => {
//     Speech.stop();
//     setIsSpeaking(false);
//     setIsLoading(false);

//     try {
//       await Audio.setAudioModeAsync({
//         allowsRecordingIOS: false,
//         playsInSilentModeIOS: true,
//       });
//     } catch (error) {
//       console.log("Audio mode reset error on cancel:", error);
//     }
//   };

//   return (
//     <LinearGradient
//       colors={["#250152", "#000"]}
//       start={{ x: 0, y: 0 }}
//       end={{ x: 1, y: 1 }}
//       style={styles.container}
//     >
//       <StatusBar barStyle="light-content" />
//       <Image
//         source={require("@/assets/main/blur.png")}
//         style={{ position: "absolute", right: scale(-15), top: 0, width: scale(240) }}
//       />
//       <Image
//         source={require("@/assets/main/purple-blur.png")}
//         style={{ position: "absolute", left: scale(-15), bottom: verticalScale(100), width: scale(210) }}
//       />

//       <View style={styles.bottomTextContainer}>
//         <ScrollView
//           style={styles.scrollView}
//           contentContainerStyle={{ alignItems: "center" }}
//           showsVerticalScrollIndicator={false}
//         >
//           <Text style={styles.instruction}>Press the microphone to start recording!</Text>
//           {text ? <Text style={styles.transcript}>You: {text}</Text> : null}
//           {response ? <Text style={styles.response}>Allie: {response}</Text> : null}
//         </ScrollView>
//       </View>

//       <View style={{ position: "absolute", bottom: verticalScale(40), alignItems: "center" }}>
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

//         {(isLoading || isSpeaking) && (
//           <TouchableOpacity onPress={cancelSpeaking} style={{ marginTop: 10 }}>
//             <Text style={{ color: "#ff6464", fontSize: 16 }}>Cancel</Text>
//           </TouchableOpacity>
//         )}

//         {isLoading && (
//           <View style={{ marginTop: 10 }}>
//             <ActivityIndicator size="large" color="#fff" />
//           </View>
//         )}
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
//     position: "absolute",
//     top: verticalScale(90),
//     alignItems: "center",
//     width: scale(350),
//     height: verticalScale(250),
//   },
//   instruction: {
//     color: "#fff",
//     fontSize: scale(16),
//     width: scale(269),
//     textAlign: "center",
//     lineHeight: 25,
//     marginBottom: verticalScale(10),
//   },
//   transcript: {
//     color: "#9ddcff",
//     fontSize: scale(14),
//     fontStyle: "italic",
//     marginBottom: verticalScale(5),
//   },
//   response: {
//     color: "#fff",
//     fontSize: scale(16),
//     textAlign: "center",
//     paddingHorizontal: scale(10),
//   },
//   scrollView: {
//     width: "100%",
//   },
// });
