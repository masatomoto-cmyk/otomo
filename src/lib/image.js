// 選んだ画像を中央で正方形に切り抜き、256px の webp にする（webp 非対応のブラウザでは png）。
// 容量を抑えるのと同時に、写真に含まれる撮影場所などの情報（EXIF）もここで落ちる
export async function toSquareWebp(file, size = 256) {
  if (!file.type.startsWith('image/')) throw new Error('画像ファイルを選んでください')
  if (file.size > 15 * 1024 * 1024) throw new Error('画像が大きすぎます（15MBまで）')
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  canvas.getContext('2d').drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size)
  bitmap.close()
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85))
  if (!blob) throw new Error('画像を変換できませんでした')
  return blob
}
