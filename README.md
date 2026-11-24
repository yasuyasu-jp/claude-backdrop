# backdrop-switcher

Claude のデスクトップ／モバイルアプリで、会話の背景をカスタマイズする Mod です。
`/backdrop` コマンドで、動くシーン（星空・夕焼け・海の中・桜）や、好きな単色・グラデーションに切り替えられます。
選んだ背景は保存され、次のセッションでも自動で復元されます。

## 使い方

- `/backdrop` … 現在の背景と使い方を表示
- `/backdrop night` / `sunset` / `ocean` / `sakura` … 動くシーン
- `/backdrop color #1e293b` … 単色
- `/backdrop gradient #0f172a #6d28d9 135` … グラデーション（色 2〜6 個、最後に角度）
- `/backdrop glass 0.4` … シーンの上に重なるパネルの不透明度（0〜1）
- `/backdrop off` … アプリ標準の背景に戻す

ターミナルやエディタでは背景は描画されません。

## インストール

ターミナルの Claude Code のプロンプトで:

```
/plugin install backdrop-switcher --marketplace yasuyasu-jp/claude-backdrop
```

`Add marketplace?` には `y`、続くスコープの選択は Enter（ユーザースコープ）で確定します。

シェルから:

```bash
claude plugin install backdrop-switcher --marketplace yasuyasu-jp/claude-backdrop
```

デスクトップアプリ（`/plugin` が使えない場合）: プロンプト欄の横の **+** → **Plugins** → **Add marketplace** に `yasuyasu-jp/claude-backdrop` を入力 → **Add plugin**。

## ライセンス

MIT
