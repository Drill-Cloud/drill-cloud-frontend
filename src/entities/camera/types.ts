export type CameraItem = {
  name: string;
  protocol: string;
  source: string;
};

export type CameraResponse = {
  edge: string;
  items: CameraItem[];
};
