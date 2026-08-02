export interface ITopic {
    name: string;
    text: string[] | string;
    sufix: number | undefined;
    topics: string[] | string | undefined;
    breakdown: string[];
    type: string;
}
