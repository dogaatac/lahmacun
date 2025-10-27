import { Platform, Alert, Linking, PermissionsAndroid } from "react-native";

export class PermissionsHelper {
  static async requestStoragePermission(): Promise<boolean> {
    if (Platform.OS === "ios") {
      return true;
    }

    try {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (error) {
      console.warn("Error requesting storage permission:", error);
      return false;
    }
  }

  static async checkStoragePermission(): Promise<boolean> {
    if (Platform.OS === "ios") {
      return true;
    }

    try {
      if (Platform.Version >= 33) {
        const result = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        );
        return result;
      } else {
        const result = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );
        return result;
      }
    } catch (error) {
      console.warn("Error checking storage permission:", error);
      return false;
    }
  }

  static async ensureStoragePermission(): Promise<boolean> {
    const hasPermission = await this.checkStoragePermission();

    if (hasPermission) {
      return true;
    }

    const granted = await this.requestStoragePermission();

    if (!granted) {
      Alert.alert(
        "Permission Required",
        "This app needs storage permission to import documents. Would you like to open settings?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => {
              Linking.openSettings();
            },
          },
        ]
      );
    }

    return granted;
  }
}

export default PermissionsHelper;
