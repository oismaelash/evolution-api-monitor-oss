const fs = require('fs');

const files = process.argv.slice(2);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('next-auth')) {
    content = content.replace(/import \{ getServerSession \} from 'next-auth';\n?/g, '');
    changed = true;
  }
  if (content.includes('@/lib/auth')) {
    content = content.replace(/import \{ authOptions \} from '@\/lib\/auth';\n?/g, '');
    changed = true;
  }

  // API Routes
  if (file.includes('/api/')) {
    content = content.replace(/const session = await getServerSession\(authOptions\);\s*if \(\!session\?\.user\?\.id\) \{\s*return NextResponse\.json\(\{ error: 'Unauthorized' \}, \{ status: 401 \}\);\s*\}/g, "const userId = 'oss-user-id';");
    content = content.replace(/session\.user\.id/g, 'userId');
    
    // For specific cases like route.ts where it might not return NextResponse but maybe something else
    content = content.replace(/const session = await getServerSession\(authOptions\);\s*if \(\!session\?\.user\?\.id\) \{\s*throw new AppError\('Unauthorized', 401\);\s*\}/g, "const userId = 'oss-user-id';");
    
    // Simple fallback
    content = content.replace(/const session = await getServerSession\(authOptions\);/g, "const userId = 'oss-user-id';");
    
    // Also remove any remaining `if (!session?.user?.id)` blocks just in case they were formatted differently
    content = content.replace(/if \(\!userId\) \{\s*return NextResponse\.json\(\{ error: 'Unauthorized' \}, \{ status: 401 \}\);\s*\}/g, "");
    content = content.replace(/if \(\!session\?\.user\?\.id\) \{\s*return NextResponse\.json\(\{ error: 'Unauthorized' \}, \{ status: 401 \}\);\s*\}/g, "");
  } else {
    // Pages and Layouts
    content = content.replace(/const session = await getServerSession\(authOptions\);\s*if \(\!session\?\.user\?\.id\) \{\s*redirect\('\/login'\);\s*\}/g, "const session = { user: { id: 'oss-user-id', name: 'OSS User', email: 'oss@localhost', requiresDisplayName: false } };");
    content = content.replace(/const session = await getServerSession\(authOptions\);/g, "const session = { user: { id: 'oss-user-id', name: 'OSS User', email: 'oss@localhost', requiresDisplayName: false } };");
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
}
