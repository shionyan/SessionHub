// オブジェクトの種別を定義
export type ObjectType = 'PANEL' | 'FRAME';
export type ImageType = 'RASTER' | 'VECTOR';
export type AssetType = 'PANEL' | 'CHARACTER' | 'ICON';

// 9方向の配置定義
export type TokenAlignment = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

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

  isCommon?: boolean;           // commonかどうか
  isScript?: boolean;           // scriptがあるかどうか
  imageType?: ImageType;        // Raster or Vector
  alignment?: TokenAlignment;   // アラインメント
  rotation?: number;            // 度数法 (deg)
  locked?: boolean;             // 位置・サイズ変更のロック
  visible?: boolean;            // 非表示 (falseの場合、PLには見えない想定)

  // プロパティ
  src: string;  // 画像URL
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
};