export type Dict = { [key: string]: string };

export interface IToken {
  text: string;
  pre?: string;
  post?: string;
  tags?: string[];
  val?: Dict;
  tScore?: number;
  pos?: number;
}
