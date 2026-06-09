# To run web-ext
```
pnpm install
pnpm exec web-ext run --target=chromium
```


# Then open Facebook and perform the following actions:
- Open a post modal from a list page.
- Scroll to load comments.
- Click "View replies" on a first-level comment.
- Click "View replies" on a second-level comment.
- Change the comment sorting to "All comments".


Should see the logs in web-ext debug logs.