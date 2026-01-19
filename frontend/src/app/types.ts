export interface MediaItem {
    url: string;
    type: string;
}

export interface Entity {
    type: string;
    offset: number;
    length: number;
    url?: string;
}

export interface LinkPreview {
    url: string;
    title: string;
    description: string;
    image: string;
    site_name: string;
}

export interface Post {
    id: number;
    telegram_message_id: number;
    content: string | null;
    entities: Entity[];
    source_url: string | null;
    media: MediaItem[];
    media_group_id: string | null;
    link_preview: LinkPreview | null;
    tab_id: number | null;
    created_at: string;
}

export interface Tab {
    id: number;
    user_id: number;
    title: string;
}
