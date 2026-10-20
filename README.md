# Vallech, landing page

Site estático (HTML, CSS e JS puros, GSAP 3.13 + ScrollTrigger copiados para `assets/js`). Não tem build.

Para ver localmente:

```bash
python -m http.server 5173
```

Publicado na Vercel direto deste repositório (preset **Other**, sem build command, output = raiz). Todo push na `main` gera deploy automático.

## Publicar (Hostinger)
O CDN da Hostinger guarda CSS e JS por 7 dias. Antes de subir, rode:

```bash
python version-assets.py
```

Ele coloca `?v=<hash>` nos links de CSS/JS do `index.html`, então qualquer mudança vira um endereço novo e ninguém fica com o arquivo velho.

## Fontes
- Kycron (display, arquivo enviado pelo cliente/agência). Confirmar se a licença cobre uso web.
- Archivo (texto), Google Fonts, licença OFL, servida localmente.

## Fotos
Todas são trabalhos reais da Vallech, da pasta `Fotos/`, convertidas para WebP em 3 ou 4 larguras. Placas visíveis foram desfocadas ou cortadas.

## Pendências para validar com o cliente
- PPG: o texto diz "pinta com tintas PPG". Não há logo nem menção a parceria. Confirmar se pode citar a marca.
- SONAX: o texto diz "feita com produtos SONAX", sem sugerir parceria.
- "Mais de 30 anos de experiência" aparece separado de "5 anos de Vallech", como pede o briefing.
- Não há foto de pinça de freio personalizada nem de insulfilm sendo aplicado. Insulfilm usa a lateral do Mustang fosco com vidros escuros. Vale fotografar esses serviços.
- Sem horário de funcionamento, e-mail ou redes sociais: o briefing não traz esses dados.
- Falta um domínio para preencher `og:url` e usar URL absoluta em `og:image`.
