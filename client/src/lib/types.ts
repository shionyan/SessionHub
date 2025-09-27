// オブジェクトの種別を定義
export type ObjectType = 'PANEL' | 'FRAME';
export type ImageType = 'RASTER' | 'VECTOR';

export type SceneObject = {
  id: string;
  objectType: ObjectType; // PANEL か FRAME か

  isCommon?: boolean;
  isScript?: boolean;
  imageType?: ImageType;

  // プロパティ
  src: string;  // 画像URL
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
};