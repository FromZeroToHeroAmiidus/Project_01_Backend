import * as mimeTypes from 'mime-types';
//import fs from 'fs';
import * as fs from 'fs';
import Logging from '../library/Logging';
import { diskStorage, Options } from 'multer';
import { extname } from 'path';

type validFileExtensionsType = 'png' | 'jpg' | 'jpeg';
type validMimeType = 'image/png' | 'image/jpg' | 'image/jpeg';

const validFileExtensions: validFileExtensionsType[] = ['png', 'jpg', 'jpeg'];
const validMimeTypes: validMimeType[] = [
  'image/png',
  'image/jpg',
  'image/jpeg',
];

export const saveImageToStorage: Options = {
  storage: diskStorage({
    destination: './files',
    filename(req, file, callback) {
      // Create unique suffix
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      // Get file extension
      const ext = extname(file.originalname);
      // Write filename
      const filename = `${uniqueSuffix}${ext}`;

      callback(null, filename);
    },
  }),
  fileFilter(req, file, callback) {
    const ext = extname(file.originalname).slice(1).toLowerCase();
    const allowedFileExtensions: validFileExtensionsType[] =
      validFileExtensions;
    allowedFileExtensions.includes(ext as validFileExtensionsType)
      ? callback(null, true)
      : callback(null, false);
  },
};

export const isFileExtensionSafe = (fullFilePath: string): boolean => {
  try {
    const ext = extname(fullFilePath).slice(1).toLowerCase();
    const mimeType = mimeTypes.lookup(ext);
    if (!mimeType) return false;

    const isFileTypeLegit = validFileExtensions.includes(
      ext as validFileExtensionsType,
    );
    const isMimeTypeLegit = validMimeTypes.includes(mimeType as validMimeType);
    return isFileTypeLegit && isMimeTypeLegit;
  } catch (error) {
    Logging.error(error);
    return false;
  }
};

export const removeFile = (fullFilePath: string): void => {
  try {
    fs.unlinkSync(fullFilePath);
  } catch (error) {
    //Logging.error(error);
    console.log('Error : ' + error);
    console.log('Error : ' + error.message);
  }
};
