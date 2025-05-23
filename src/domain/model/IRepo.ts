export interface IRepo {
    name: string;
    description: string;
    repository: string;
    webpage: string;
    created: string;
    pushed: string;
    languages: { [key: string]: number };
    topics: string[];
    subtopics: string[];
    private: boolean;
    show: boolean
}
