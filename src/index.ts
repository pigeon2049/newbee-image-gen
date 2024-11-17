import { Context, Schema, segment } from 'koishi'

export const name = 'newbee-image-gen'

export interface Config {
  model: string,
  CLOUDFLARE_AccountID: string,
  CLOUDFLARE_API_TOKEN: string
}

export const Config: Schema<Config> = Schema.object({
  CLOUDFLARE_AccountID: Schema.string().required(),
  CLOUDFLARE_API_TOKEN: Schema.string().required(),
  model: Schema.string().default('@cf/bytedance/stable-diffusion-xl-lightning')
})

export function apply(ctx: Context, config: Config) {
  // 注册指令
  ctx.command('画图 <content>', '生成图片')
    .usage('画图 [描述]')  // 可选：指令帮助文本
    .action(async (_, content) => {
      if (!content) {
        return '请详细描述画图需求，例如：画图 猫猫'
      }

      const finalUrl = `https://api.cloudflare.com/client/v4/accounts/${config.CLOUDFLARE_AccountID}/ai/run/${config.model}`
      const token = `Bearer ${config.CLOUDFLARE_API_TOKEN}`
      const headers = {
        'Authorization': token
      }
      const body = { prompt: content }

      try {
        const response = await ctx.http.post(finalUrl, body, {
          headers,
          responseType: 'arraybuffer' // 确保返回的是二进制数据
        })

        // 将返回的二进制数据转换为 Base64
        const base64Image = Buffer.from(response).toString('base64')
        const mimeType = 'image/png' // 确定返回类型为 PNG
        const base64Url = `data:${mimeType};base64,${base64Image}`

        // 使用 segment 发送图片
        return segment.image(base64Url)
      } catch (error: any) {
        console.error('Error generating image:', error)

        // 检查错误响应
        if (error.response) {
          const status = error.response.status
          const message = error.response.data?.message || error.message
          return `生成图片失败 (HTTP ${status}): ${message}`
        } else {
          return '生成图片失败，请检查配置或稍后再试。'
        }
      }
    })
}
