import { ImageSourcePropType } from 'react-native';
import studentAvatar from '../../assets/images/student_id_avatar_1790959893290.jpg';
import personnelAvatar from '../../assets/images/personnel_id_avatar_1790959908050.jpg';

const studentDefault = studentAvatar as any;
const personnelDefault = personnelAvatar as any;

export const studentAvatarSource = (uri?: string): ImageSourcePropType => (
  !uri || uri.startsWith('/src/assets/images/student_id_avatar') ? studentDefault : { uri }
);

export const personnelAvatarSource = (uri?: string): ImageSourcePropType => (
  !uri || uri.startsWith('/src/assets/images/personnel_id_avatar') ? personnelDefault : { uri }
);
