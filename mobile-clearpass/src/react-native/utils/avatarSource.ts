import { ImageSourcePropType } from 'react-native';

const studentDefault = require('../../assets/images/student_id_avatar_1790959893290.jpg');
const personnelDefault = require('../../assets/images/personnel_id_avatar_1790959908050.jpg');

export const studentAvatarSource = (uri?: string): ImageSourcePropType => (
  !uri || uri.startsWith('/src/assets/images/student_id_avatar') ? studentDefault : { uri }
);

export const personnelAvatarSource = (uri?: string): ImageSourcePropType => (
  !uri || uri.startsWith('/src/assets/images/personnel_id_avatar') ? personnelDefault : { uri }
);
