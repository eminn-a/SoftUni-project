const router = require("express").Router();
const cubeManager = require("../manager/cubeManager");
const accessoryManager = require("../manager/accessoryManager");
const { getDifficultyOptionViewData } = require("../utils/viewHelper");
const { isAuth } = require("../middlewares/authMiddleware");

router.get("/create", isAuth, (req, res) => {
  res.render("cube/create");
});

router.post("/create", async (req, res) => {
  const { name, description, imageUrl, difficultyLevel } = req.body;

  await cubeManager.create({
    name,
    description,
    imageUrl,
    difficultyLevel: Number(difficultyLevel),
    owner: req.user._id,
  });

  res.redirect("/");
});

router.get("/:cubeId/details", async (req, res) => {
  const id = req.params.cubeId;
  const cube = await cubeManager.getOneWithAccessories(id).lean();

  if (!cube) {
    return res.redirect("/404");
  }
  const isOwner = cube.owner?.toString() === req.user?._id;
  res.render("cube/details", { ...cube, isOwner });
});

router.get("/:cubeId/attach-accessory", isAuth, async (req, res) => {
  const cube = await cubeManager.getOne(req.params.cubeId).lean();
  const accessories = await accessoryManager.getAll().lean();

  const hasAccessories = accessories.length > 0;

  res.render("accessory/attach", { cube, accessories, hasAccessories });
});

router.post("/:cubeId/attach-accessory", async (req, res) => {
  const { accessory: accessoryId } = req.body;
  const cubeId = req.params.cubeId;

  await cubeManager.attachAccessory(cubeId, accessoryId);

  res.redirect(`/cubes/${cubeId}/details`);
});

router.get("/:cubeId/delete", isAuth, async (req, res) => {
  const cube = await cubeManager.getOne(req.params.cubeId).lean();
  const option = getDifficultyOptionViewData(cube.difficultyLevel);

  res.render("cube/delete", { cube, option });
});

router.post("/:cubeId/delete", async (req, res) => {
  await cubeManager.delete(req.params.cubeId);
  res.redirect("/");
});

router.get("/:cubeId/edit", isAuth, async (req, res) => {
  const cube = await cubeManager.getOne(req.params.cubeId).lean();
  const option = getDifficultyOptionViewData(cube.difficultyLevel);
  res.render("cube/edit", { cube, option });
});

router.post("/:cubeId/edit", async (req, res) => {
  const cubeData = req.body;
  await cubeManager.update(req.params.cubeId, cubeData);

  res.redirect(`/cubes/${req.params.cubeId}/details`);
});

module.exports = router;

function getDifficultyOptionViewData(difficultyLevel) {
  const titles = [
    "Very Easy",
    "Easy",
    "Medium (Standart 3x3",
    "Intermediate",
    "Expert",
    "Hardcore",
  ];
  const option = titles.map((title, index) => ({
    title: `${index + 1} - ${title}`,
    value: index + 1,
    selected: Number(difficultyLevel) == index + 1,
  }));
  return option;
}
