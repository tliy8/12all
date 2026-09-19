<xhs-publish-btn data-v-0a61f43e="" data-v-74e5df5a-s="" is-publish="true" is-save-draft="true" submit-text="发布" save-text="暂存离开" submit-disabled="false" save-disabled="false"><template shadowrootmode="closed"><style>
:host {
  display: block;
  position: sticky;
  bottom: 0;
  z-index: 101;
  width: 100%;
  flex-shrink: 0;
}
.publish-page-publish-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  width: 100%;
  height: 90px;
  min-height: 90px;
  background:
    linear-gradient(180deg, rgba(248,248,248,0) 0%, rgba(248,248,248,.8) 40%),
    linear-gradient(180deg, rgba(248,248,248,0) 0%, rgba(248,248,248,.8) 70%),
    linear-gradient(180deg, rgba(248,248,248,0) 0%, rgba(248,248,248,.8) 100%),
    linear-gradient(180deg, rgba(248,248,248,0) 0%, #F8F8F8 100%);
}
.ce-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 40px;
  padding: 6px 20px;
  border-radius: 20px;
  flex-shrink: 0;
  border: none;
  cursor: pointer;
  font-family: "PingFang SC", -apple-system, sans-serif;
  font-size: 14px;
  font-weight: var(--size-text-font-weight-bold, 500);
  line-height: 1;
  transition: background 0.2s;
  box-sizing: border-box;
}
.ce-btn.white {
  color: var(--color-text-paragraph, rgba(0, 0, 0, 0.7));
  background: #fff;
  box-shadow: 0 6px 24px 0 rgba(0, 0, 0, 0.07);
}
.ce-btn.white:hover:not(:disabled)  { background: var(--color-grey-0, #fafafa); }
.ce-btn.white:active:not(:disabled) { background: rgba(0, 0, 0, 0.05); }
.ce-btn.bg-red {
  color: #fff;
  background: var(--color-brand-6, #ff2442);
  box-shadow: 0 6px 24px 0 rgba(173, 88, 88, 0.27);
}
.ce-btn.bg-red:hover:not(:disabled)  { background: var(--color-brand-7, #db0031); }
.ce-btn.bg-red:active:not(:disabled) { background: var(--color-brand-8, #a00020); }
.ce-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style><div data-v-app=""><div class="publish-page-publish-btn"><button type="button" class="ce-btn white">暂存离开</button><button type="button" class="ce-btn bg-red">发布</button></div></div></template></xhs-publish-btn>