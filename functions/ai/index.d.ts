export default function ai(ctx: any): Promise<{
    meta?: Record<string, unknown> | undefined;
    success: true;
    data: {
        source: string;
        analysis: {
            keywords: any;
            sentiment: any;
        };
        message: string;
    };
} | {
    status: number;
    body: {
        success: false;
        error: {
            code: import("../common/errors").ErrorCode;
            message: string;
            requestId: string | undefined;
        };
    };
}>;
