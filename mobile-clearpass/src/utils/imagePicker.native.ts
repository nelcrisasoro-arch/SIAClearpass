import * as ImagePicker from 'expo-image-picker';

export const pickProfileImage = async (): Promise<string | null> => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.4,
    base64: true,
  });

  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;
  return asset.base64 ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}` : asset.uri;
};
