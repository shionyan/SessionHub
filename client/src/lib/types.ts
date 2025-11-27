// オブジェクトの種別を定義
export type ObjectType = 'PANEL' | 'FRAME';
export type ImageType = 'RASTER' | 'VECTOR';
export type AssetType = 'PANEL' | 'CHARACTER' | 'ICON';

export interface ImageAsset {
  id: string;
  src: string;
  thumbnail: string;
  type: AssetType;
  tags: string[];
}

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