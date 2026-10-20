// The web workspace does not install Expo native modules. The mobile project
// supplies their concrete typings from its own node_modules during Expo builds.
// These narrow shims keep the shared React Native source type-checkable here.
declare module 'expo-image-picker' {
  const ImagePicker: any;
  export = ImagePicker;
}

declare module 'expo-notifications' {
  const Notifications: any;
  export = Notifications;
}
