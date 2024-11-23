import { BinaryField, ExifDateTime, ExifTool } from "exiftool-vendored";

export const getExifMetadata = (filePath: string) => {
  return new Promise<ExifMetadata>(async (res, rej) => {
    const exiftool = new ExifTool();
    try {
      const metadata = await exiftool.read(filePath);
      res(metadata as unknown as ExifMetadata);
    } catch (error) {
      console.error("Error reading metadata:", error);
      rej(error);
    } finally {
      await exiftool.end();
    }
  });
};

export type ExifMetadata = ExifCommonMetadata &
  Partial<ExifVideoMetadata & ExifAaeMetadata>;

export interface ExifCommonMetadata {
  SourceFile: string; // "/my-folder/IMG_7367.MOV"
  errors: any[];
  warnings: any[];
  ExifToolVersion: number; // 13
  FileName: string; // "IMG_7367.MOV"
  Directory: string; // "/my-folder
  FileSize: string; // "24 MB"
  FileModifyDate: ExifDateTime;
  FileAccessDate: ExifDateTime;
  FileInodeChangeDate: ExifDateTime;
  FilePermissions: string; // "-rw-------"
  FileType: string; // "MOV"
  FileTypeExtension: string; // "mov"
  MIMEType: string; // "video/quicktime"
}

export interface ExifVideoMetadata {
  tz: string; // "America/Los_Angeles"
  tzSource: string; // "GPSLatitude/GPSLongitude"
  Duration: number; // 11.7333333333333
  PreviewDuration: number; // 0
  SelectionDuration: number; // 0
  TrackDuration: number; // 11.7333333333333
  MediaDuration: number; // 11.7333333333333
  GPSAltitude: number; // 33.612
  MajorBrand: string; // "Apple QuickTime (.MOV/QT)"
  MinorVersion: string; // "0.0.0"
  CompatibleBrands: string[]; // ["qt  "]
  MediaDataSize: number; // 23751667
  MediaDataOffset: number; // 36
  MovieHeaderVersion: number; // 0
  CreateDate: ExifDateTime | string;
  ModifyDate: ExifDateTime;
  TimeScale: number; // 600
  PreferredRate: number; // 1
  PreferredVolume: string; // "100.00%"
  PreviewTime: string; // "0 s",
  PosterTime: string; // "0 s",
  SelectionTime: string; // "0 s",
  CurrentTime: string; // "0 s",
  NextTrackID: number; // 5,
  TrackHeaderVersion: number; // 0,
  TrackCreateDate: ExifDateTime;
  TrackModifyDate: ExifDateTime;
  TrackID: number; // 1,
  TrackLayer: number; // 0,
  TrackVolume: string; // "0.00%",
  ImageWidth: number; // 1920,
  ImageHeight: number; // 1440,
  CleanApertureDimensions: string; // "1920x1440",
  ProductionApertureDimensions: string; // "1920x1440",
  EncodedPixelsDimensions: string; // "1920x1440",
  GraphicsMode: string; // "ditherCopy",
  OpColor: string; // "32768 32768 32768",
  CompressorID: string; // "hvc1",
  SourceImageWidth: number; // 1920,
  SourceImageHeight: number; // 1440,
  XResolution: number; // 72,
  YResolution: number; // 72,
  CompressorName: string; // "HEVC",
  BitDepth: number; // 24,
  PixelAspectRatio?: string; // "1:1",
  VideoFrameRate: number; // 30,
  Balance: number; // 0,
  AudioFormat: string; // "lpcm",
  AudioChannels: number; // 3,
  AudioBitsPerSample: number; // 16,
  AudioSampleRate: number; // 1,
  MatrixStructure: string; // "1 0 0 0 1 0 0 0 1",
  ContentDescribes: string; // "Track 1",
  MediaHeaderVersion: number; // 0,
  MediaCreateDate: ExifDateTime | string;
  MediaModifyDate: ExifDateTime;
  MediaTimeScale: number; // 600,
  MediaLanguageCode: string; // "und",
  GenMediaVersion: number; // 0,
  GenFlags: string; // "0 0 0",
  GenGraphicsMode: string; // "ditherCopy",
  GenOpColor: string; // "32768 32768 32768",
  GenBalance: number; // 0,
  HandlerClass: string; // "Data Handler",
  HandlerVendorID: string; // "Apple",
  Encoder?: string; // "Lavf58.45.100",
  HandlerDescription: string; // "Core Media Data Handler",
  MetaFormat: string; // "mebx",
  HandlerType: string; // "Metadata Tags",
  LocationAccuracyHorizontal: number; // 15.617088,
  GPSCoordinates: string; // `37 deg 20' 57.84" N, 121 deg 53' 29.04" W, 33.612 m Above Sea Level`,
  Make: string; // "Apple",
  Model: string; // "iPhone 13 mini",
  Software: string; // "15.6.1",
  CreationDate: ExifDateTime;
  ImageSize: string; // "1920x1440",
  Megapixels: number; // 2.8,
  AvgBitrate: string; // "16.2 Mbps",
  GPSAltitudeRef: string; // "Above Sea Level",
  GPSLatitude: number; // 37.3494,
  GPSLongitude: number; // -121.8914,
  Rotation: number; // 90,
  GPSPosition: string; // `37 deg 20' 57.84" N, 121 deg 53' 29.04" W`,
}

export interface ExifAaeMetadata {
  AdjustmentBaseVersion?: number; // 0
  AdjustmentData?: BinaryField;
  AdjustmentFormatIdentifier?: string; // "com.apple.photo"
  AdjustmentFormatVersion?: number; // 1.6,
  AdjustmentRenderTypes?: number; // 0,
}
