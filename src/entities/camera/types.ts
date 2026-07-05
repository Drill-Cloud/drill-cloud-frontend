export type CameraItem = {
  protocol: string;
  source: string;
};

export type CameraResponse = {
  edge: string;
  items: CameraItem[];
};
