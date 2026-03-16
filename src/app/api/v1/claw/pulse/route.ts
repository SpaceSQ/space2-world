import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化服务端的 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { gene_lock } = body;

        if (!gene_lock) {
            return NextResponse.json({ error: 'Missing gene_lock in payload' }, { status: 400 });
        }

        console.log(`[API] 📡 Received wild pulse from gene_lock: ${gene_lock}`);

        // 🔥 将接收到的心跳写入 Supabase 数据库
        // 注意：你需要在 Supabase 中建一个名为 `handshakes` 的表，包含 `gene_lock` (text) 字段
        const { error } = await supabase.from('handshakes').insert({
            gene_lock: gene_lock,
            status: 'VERIFIED'
        });

        if (error) throw error;

        return NextResponse.json({ 
            success: true, 
            message: 'Pulse verified by Space² Continuum. Check your web terminal for ID Card.' 
        });

    } catch (error: any) {
        console.error('Pulse API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}