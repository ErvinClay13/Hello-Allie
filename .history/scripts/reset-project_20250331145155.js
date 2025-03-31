#!/usr/bin/env node

/**
 *  Reset Project Script
 * ------------------------
 * This Node.js script resets the current project to a blank state.
 * It:
 * - Moves the existing `/app`, `/components`, `/hooks`, `/constants`, and `/scripts` folders into a new folder called `/app-example`.
 * - Creates a fresh `/app` folder with minimal `index.tsx` and `_layout.tsx` files.
 * 
 *  Once run, you can:
 * 1. Safely delete this script.
 * 2. Remove the `reset-project` entry from package.json.
 */

const fs = require("fs");
const path = require("path");

// Define paths and directories to work with
const root = process.cwd(); // Current working directory
const oldDirs = ["app", "components", "hooks", "constants", "scripts"]; // Folders to move
const newDir = "app-example"; // Destination folder
const newAppDir = "app"; // Fresh app folder
const newDirPath = path.join(root, newDir); // Full path to /app-example

// Template content for the new app/index.tsx
const indexContent = `import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
    </View>
  );
}
`;

// Template content for the new app/_layout.tsx
const layoutContent = `import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
`;

// Main function to move old directories and create new ones
const moveDirectories = async () => {
  try {
    //  Create the /app-example folder if it doesn't exist
    await fs.promises.mkdir(newDirPath, { recursive: true });
    console.log(` /${newDir} directory created.`);

    //  Move each old directory into /app-example
    for (const dir of oldDirs) {
      const oldDirPath = path.join(root, dir);
      const newDirPath = path.join(root, newDir, dir);
      if (fs.existsSync(oldDirPath)) {
        await fs.promises.rename(oldDirPath, newDirPath);
        console.log(`/${dir} moved to /${newDir}/${dir}.`);
      } else {
        console.log(`/${dir} does not exist, skipping.`);
      }
    }

    // Create a new /app directory
    const newAppDirPath = path.join(root, newAppDir);
    await fs.promises.mkdir(newAppDirPath, { recursive: true });
    console.log("\n New /app directory created.");

    // 📄 Create a new index.tsx file inside /app
    const indexPath = path.join(newAppDirPath, "index.tsx");
    await fs.promises.writeFile(indexPath, indexContent);
    console.log("📄 app/index.tsx created.");

    // 📄 Create a new _layout.tsx file inside /app
    const layoutPath = path.join(newAppDirPath, "_layout.tsx");
    await fs.promises.writeFile(layoutPath, layoutContent);
    console.log("📄 app/_layout.tsx created.");

    // ✅ Final console messages
    console.log("\n✅ Project reset complete. Next steps:");
    console.log(
      "1. Run `npx expo start` to start a development server.\n2. Edit app/index.tsx to edit the main screen.\n3. Delete the /app-example directory when you're done referencing it."
    );
  } catch (error) {
    console.error(`❌ Error during script execution: ${error}`);
  }
};

// 🚀 Run the script
moveDirectories();

